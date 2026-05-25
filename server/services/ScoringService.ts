import { SubmissionRepository } from "../repositories/SubmissionRepository";
import { ConfigRepository } from "../repositories/ConfigRepository";
import { Submission, Challenge } from "../../shared/schema";
import { db } from "../db";
import { infraMetrics } from "../../shared/schema";

/**
 * ScoringService - Implements core business logic simulating the event-driven AWS serverless pipeline.
 * Submissions trigger a virtual Kafka queue, AWS Lambda, dynamic ECS Fargate tasks,
 * parameter configuration overrides, and AWS Review API posts.
 */
export class ScoringService {
  private submissionRepo = new SubmissionRepository();
  private configRepo = new ConfigRepository();
  
  // Track currently active simulation loads
  private activeTasks = 0;
  private queueLength = 0;

  async queueSubmission(submissionId: number, challenge: Challenge): Promise<void> {
    this.queueLength++;
    this.updateMetrics();
    
    // Simulate background worker thread trigger (like Kafka -> Lambda -> ECS Fargate launch)
    this.processScoring(submissionId, challenge).catch(err => {
      console.error(`[ScoringService ERROR] Processing submission ${submissionId} failed:`, err);
    });
  }

  private async processScoring(submissionId: number, challenge: Challenge): Promise<void> {
    const subIdStr = submissionId.toString();
    const logs: string[] = [];
    const addLog = async (msg: string) => {
      const formatted = `[${new Date().toISOString()}] ${msg}`;
      logs.push(formatted);
      await this.submissionRepo.addLog(submissionId, msg);
    };

    try {
      // 1. Submitted State
      await addLog("⚡ KAFKA EVENT DETECTED: New submission published to topic 'marathon-submissions'");
      await addLog(`⚡ KAFKA MESSAGE INFO: payload={"submissionId": "${subIdStr}", "challengeId": "${challenge.id}"}`);
      await this.submissionRepo.updateStatus(submissionId, "submitted");

      // Resolve SSM configurations
      const maxTasksParam = await this.configRepo.findByKey("MAX_CONCURRENT_TASKS");
      const startupDelayParam = await this.configRepo.findByKey("FARGATE_STARTUP_DELAY_MS");
      const maxTasks = maxTasksParam ? parseInt(maxTasksParam.value) : 5;
      const startupDelay = startupDelayParam ? parseInt(startupDelayParam.value) : 3000;

      // Simulate waiting in Queue if Fargate is throttled
      if (this.activeTasks >= maxTasks) {
        await addLog(`[QUEUE] Max Fargate capacity reached (${this.activeTasks}/${maxTasks}). Submission queued.`);
        while (this.activeTasks >= maxTasks) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Transition queue state to Active Task scaling
      this.queueLength = Math.max(0, this.queueLength - 1);
      this.activeTasks++;
      this.updateMetrics();

      // 2. Spawn AWS Lambda & EC2/Fargate Scaling
      await addLog("🚀 AWS LAMBDA: Invoked by Kafka event source mapping");
      await addLog("🚀 AWS LAMBDA: Calling ecs.runTask() to scale up on-demand Fargate task...");
      await addLog(`🌐 AWS ECS FARGATE: Initializing cluster 'marathon-scoring-cluster', task ARN: arn:aws:ecs:us-east-1:123456789012:task/marathon-cluster/${Math.random().toString(36).substring(2, 10)}`);
      
      // Simulate ECR docker pull & container boot duration (<30s in real, represented by user config delay)
      await this.submissionRepo.updateStatus(submissionId, "bootstrapping");
      await addLog("🐳 DOCKER ECR: Pulling runner image '123456789012.dkr.ecr.us-east-1.amazonaws.com/marathon-scorer-runner:latest'...");
      await new Promise(resolve => setTimeout(resolve, startupDelay * 0.4));
      
      await addLog("🐳 DOCKER ECR: Image pulled successfully (Digest: sha256:7f92021a8b9...)");
      await addLog("🌐 AWS ECS FARGATE: Container agent started. Injecting task environment configurations.");
      await new Promise(resolve => setTimeout(resolve, startupDelay * 0.3));

      // 3. AWS Parameter Store loading
      await addLog("📋 AWS PARAMETER STORE: Querying SSM Configuration at path /marathon/scorer/rules...");
      const configStrategy = await this.configRepo.findByKey("SCORING_STRATEGY");
      const configTimeout = await this.configRepo.findByKey("SCORING_TIMEOUT_SEC");
      const strategy = configStrategy ? configStrategy.value : "provisional";
      const timeout = configTimeout ? parseInt(configTimeout.value) : 180;
      
      await addLog(`📋 AWS PARAMETER STORE: Loaded property scorer_mode = "${strategy}"`);
      await addLog(`📋 AWS PARAMETER STORE: Loaded property execution_timeout = ${timeout}s`);
      await new Promise(resolve => setTimeout(resolve, startupDelay * 0.3));

      // 4. Run Example Scoring
      await this.submissionRepo.updateScoreAndLogs(submissionId, 0.0, 0, logs, "running_examples", "example");
      await addLog("==========================================================================");
      await addLog("   MARATHON SCORER RUNNER - JAVA EXECUTION ENGINE");
      await addLog("==========================================================================");
      await addLog(`[JAVA] Running com.topcoder.marathon.scorer.Scorer for challenge: ${challenge.name}`);
      await addLog(`[JAVA] Spawning BioSlimeTester for solution evaluation (Scoring Mode: ${strategy.toUpperCase()})`);
      
      // Example evaluation runs
      await addLog("[JAVA] [BioSlimeTester] Instantiating challenge grid 50x50, loading 10 initial colony cells...");
      await new Promise(resolve => setTimeout(resolve, 800));
      await addLog("[JAVA] [BioSlimeTester] Seed resolved from submission metadata. Commencing cellular tick cycles...");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await addLog("[JAVA] [BioSlimeTester] Example Test #1: Grid expansion tick 50/200, population: 42 cells");
      await new Promise(resolve => setTimeout(resolve, 400));
      await addLog("[JAVA] [BioSlimeTester] Example Test #1: Grid expansion tick 100/200, population: 84 cells");
      await new Promise(resolve => setTimeout(resolve, 400));
      await addLog("[JAVA] [BioSlimeTester] Example Test #1: Grid expansion tick 200/200, population: 154 cells (STABLE)");
      await addLog("[JAVA] [BioSlimeTester] Example Test #1: Result: SUCCESS, base score: 94.62");
      await new Promise(resolve => setTimeout(resolve, 600));

      const startTime = Date.now();

      // 5. Run Provisional Scoring
      if (strategy === "provisional" || strategy === "both") {
        await this.submissionRepo.updateScoreAndLogs(submissionId, 94.62, 1200, logs, "running_provisional", "provisional");
        await addLog("[JAVA] [BioSlimeTester] Transitioning execution flow to full PROVISIONAL test suite (10 test cases)...");
        
        for (let i = 1; i <= 5; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const testSeed = submissionId + i * 1000;
          const colonyPeak = Math.floor(60 + Math.random() * 120);
          const computed = Math.min(100.0, (colonyPeak * 15.42) / 10.0);
          await addLog(`[JAVA] [BioSlimeTester] Provisional Test #${i}: Seed: ${testSeed}, Peak Colonies: ${colonyPeak}, Score: ${computed.toFixed(2)} (Time: ${150 + Math.floor(Math.random() * 200)}ms)`);
        }
        await addLog("[JAVA] [BioSlimeTester] Standard deviation of test matrix: 1.45%");
        await addLog("[JAVA] [BioSlimeTester] Average latency per iteration: 210ms");
      } else {
        await addLog("[JAVA] [BioSlimeTester] Skipping PROVISIONAL execution matrix per SSM Scorer Mode overrides.");
      }

      const durationMs = Date.now() - startTime + startupDelay + 2000;
      // Calculate realistic score
      const finalScore = 75.0 + Math.random() * 24.5;

      // 6. Invoke external Review API
      await addLog("🚀 AWS ECS FARGATE: Task evaluation finished. Scores computed.");
      await addLog("🌐 REVIEW API INTEGRATION: Initiating callback to Review API server...");
      await addLog(`🌐 REVIEW API INTEGRATION: POST http://api.marathon.internal/review payload={"submissionId": "${subIdStr}", "score": ${finalScore.toFixed(4)}, "status": "SUCCESS"}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      await addLog("🌐 REVIEW API INTEGRATION: Status Code 200 OK. Transaction committed.");

      // 7. Complete submission status
      await this.submissionRepo.updateScoreAndLogs(submissionId, finalScore, durationMs, logs, "completed", undefined);
      await addLog("🌐 AWS ECS FARGATE: Releasing task container back to pool, shutting down container host...");

    } catch (err: any) {
      await addLog(`[FATAL ERROR] Container crashed during evaluation: ${err.message || err}`);
      await this.submissionRepo.updateScoreAndLogs(submissionId, 0.0, 0, logs, "failed", undefined);
    } finally {
      this.activeTasks = Math.max(0, this.activeTasks - 1);
      this.updateMetrics();
    }
  }

  private async updateMetrics() {
    try {
      const activeFargateTasks = this.activeTasks;
      const kafkaQueueLength = this.queueLength;
      const cpu = Math.min(95, 5 + activeFargateTasks * 18 + Math.random() * 5);
      const ram = Math.min(90, 8 + activeFargateTasks * 14 + Math.random() * 4);
      const apiLat = activeFargateTasks > 0 ? 12 + activeFargateTasks * 8 : 10 + Math.floor(Math.random() * 4);

      await db.insert(infraMetrics).values({
        activeFargateTasks,
        kafkaQueueLength,
        successRate: 98.4,
        costSavings: 82.5,
        cpuUtilization: cpu,
        memoryUtilization: ram,
        apiLatencyMs: apiLat,
      });
    } catch (err) {
      // Suppress logging of background telemetry metrics insertion errors
    }
  }

  getActiveStats() {
    return {
      activeFargateTasks: this.activeTasks,
      kafkaQueueLength: this.queueLength,
    };
  }
}
