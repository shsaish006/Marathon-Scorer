import { db } from "../db";
import { submissions, Challenge, Submission, InsertSubmission } from "../../shared/schema";
import { eq, desc } from "drizzle-orm";

/**
 * SubmissionRepository - Simulates a Spring Boot `@Repository` layer for Submissions.
 * Handles database operations for user-submitted solutions and runs scoring telemetry logs.
 */
export class SubmissionRepository {
  
  async create(submission: InsertSubmission): Promise<Submission> {
    const [result] = await db.insert(submissions).values(submission).returning();
    return result;
  }

  async findById(id: number): Promise<Submission | undefined> {
    const [result] = await db.select().from(submissions).where(eq(submissions.id, id));
    return result;
  }

  async findAll(): Promise<Submission[]> {
    return await db.select().from(submissions).orderBy(desc(submissions.createdAt));
  }

  async findByChallenge(challengeId: number): Promise<Submission[]> {
    return await db.select()
      .from(submissions)
      .where(eq(submissions.challengeId, challengeId))
      .orderBy(desc(submissions.createdAt));
  }

  async updateStatus(id: number, status: string): Promise<Submission> {
    const [result] = await db.update(submissions)
      .set({ status })
      .where(eq(submissions.id, id))
      .returning();
    return result;
  }

  async updateScoreAndLogs(
    id: number, 
    score: number, 
    processingTimeMs: number, 
    logs: string[], 
    status: string,
    activeScorer?: string
  ): Promise<Submission> {
    const [result] = await db.update(submissions)
      .set({ score, processingTimeMs, logs, status, activeScorer })
      .where(eq(submissions.id, id))
      .returning();
    return result;
  }

  async addLog(id: number, logMessage: string): Promise<Submission> {
    const submission = await this.findById(id);
    if (!submission) throw new Error("Submission not found");
    
    const updatedLogs = [...submission.logs, `[${new Date().toLocaleTimeString()}] ${logMessage}`];
    
    const [result] = await db.update(submissions)
      .set({ logs: updatedLogs })
      .where(eq(submissions.id, id))
      .returning();
    return result;
  }

  async delete(id: number): Promise<void> {
    await db.delete(submissions).where(eq(submissions.id, id));
  }
}
