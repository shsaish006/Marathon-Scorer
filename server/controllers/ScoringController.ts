import { Request, Response } from "express";
import { SubmissionRepository } from "../repositories/SubmissionRepository";
import { ChallengeRepository } from "../repositories/ChallengeRepository";
import { ScoringService } from "../services/ScoringService";
import { insertSubmissionSchema } from "../../shared/schema";
import { fromError } from "zod-validation-error";

/**
 * ScoringController - Coordinates HTTP requests for Marathon challenge submissions.
 * Serves as the @RestController counterpart in Spring Boot patterns.
 */
export class ScoringController {
  private submissionRepo = new SubmissionRepository();
  private challengeRepo = new ChallengeRepository();
  private scoringService: ScoringService;

  constructor(scoringService: ScoringService) {
    this.scoringService = scoringService;
  }

  getSubmissions = async (req: Request, res: Response) => {
    try {
      const list = await this.submissionRepo.findAll();
      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  getSubmissionById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid submission ID format." });
      
      const sub = await this.submissionRepo.findById(id);
      if (!sub) return res.status(404).json({ error: "Submission not found." });
      
      return res.json(sub);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  getChallenges = async (req: Request, res: Response) => {
    try {
      const list = await this.challengeRepo.findAll();
      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  createSubmission = async (req: Request, res: Response) => {
    try {
      // Validate inputs
      const parseResult = insertSubmissionSchema.omit({ 
        score: true, 
        processingTimeMs: true, 
        logs: true,
        status: true,
        createdAt: true,
        activeScorer: true
      }).safeParse(req.body);

      if (!parseResult.success) {
        return res.status(400).json({ error: fromError(parseResult.error).toString() });
      }

      const { challengeId, language, code } = parseResult.data;

      // Verify challenge exists
      const challenge = await this.challengeRepo.findById(challengeId);
      if (!challenge) {
        return res.status(404).json({ error: `Challenge with ID ${challengeId} not found.` });
      }

      // Record in Postgres using repository
      const submission = await this.submissionRepo.create({
        challengeId,
        language,
        code,
        status: "submitted",
        logs: [`[${new Date().toLocaleTimeString()}] Solution submitted by client.`]
      });

      // Delegate simulation trigger to ScoringService
      await this.scoringService.queueSubmission(submission.id, challenge);

      return res.status(201).json(submission);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  getActiveSimulatorStats = (req: Request, res: Response) => {
    const stats = this.scoringService.getActiveStats();
    return res.json(stats);
  };

  deleteSubmission = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid submission ID format." });
      
      const sub = await this.submissionRepo.findById(id);
      if (!sub) return res.status(404).json({ error: "Submission not found." });

      await this.submissionRepo.delete(id);
      return res.json({ message: "Submission record deleted successfully." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };
}
