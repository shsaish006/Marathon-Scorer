import { db } from "../db";
import { challenges, Challenge, InsertChallenge } from "../../shared/schema";
import { eq } from "drizzle-orm";

/**
 * ChallengeRepository - Spring-like repository managing challenge definitions.
 */
export class ChallengeRepository {
  
  async findAll(): Promise<Challenge[]> {
    return await db.select().from(challenges);
  }

  async findById(id: number): Promise<Challenge | undefined> {
    const [result] = await db.select().from(challenges).where(eq(challenges.id, id));
    return result;
  }

  async create(challenge: InsertChallenge): Promise<Challenge> {
    const [result] = await db.insert(challenges).values(challenge).returning();
    return result;
  }
}
