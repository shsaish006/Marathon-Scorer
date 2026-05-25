import { Router, Express } from "express";
import { createServer, Server } from "http";
import { ScoringService } from "./services/ScoringService";
import { ScoringController } from "./controllers/ScoringController";
import { ConfigController } from "./controllers/ConfigController";
import { MetricsController } from "./controllers/MetricsController";

/**
 * registerRoutes - Configures HTTP routing for all API resources.
 * Instantiates the underlying Repositories, Services, and Controllers.
 */
export async function registerRoutes(app: Express): Promise<Server> {
  const router = Router();

  // Instantiate Decoupled Service Layer
  const scoringService = new ScoringService();

  // Instantiate Controller Layer
  const scoringController = new ScoringController(scoringService);
  const configController = new ConfigController();
  const metricsController = new MetricsController();

  // ==========================================
  // Marathon Submission REST Endpoints
  // ==========================================
  router.get("/submissions", scoringController.getSubmissions);
  router.get("/submissions/:id", scoringController.getSubmissionById);
  router.post("/submissions", scoringController.createSubmission);
  router.delete("/submissions/:id", scoringController.deleteSubmission);
  router.get("/challenges", scoringController.getChallenges);
  router.get("/simulator/stats", scoringController.getActiveSimulatorStats);

  // ==========================================
  // AWS Parameter Store Configurations
  // ==========================================
  router.get("/parameters", configController.getParameters);
  router.get("/parameters/:key", configController.getParameterByKey);
  router.post("/parameters", configController.createParameter);
  router.patch("/parameters/:key", configController.updateParameter);
  router.delete("/parameters/:key", configController.deleteParameter);

  // ==========================================
  // Infrastructure Telemetry Feeds
  // ==========================================
  router.get("/metrics", metricsController.getRecentMetrics);
  router.get("/metrics/latest", metricsController.getLatestMetrics);
  router.get("/metrics/aggregates", metricsController.getAggregates);
  router.get("/metrics/costs", metricsController.getCostComparison);

  // Mount API prefix
  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
