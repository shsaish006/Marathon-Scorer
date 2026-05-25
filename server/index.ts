import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { db, initializeDatabase } from "./db";
import { challenges, parameterStore, infraMetrics } from "../shared/schema";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let resBody: any = null;

  const originalResJson = res.json;
  res.json = function (body) {
    resBody = body;
    return originalResJson.apply(this, arguments as any);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (resBody && res.statusCode >= 400) {
        logLine += ` :: ${JSON.stringify(resBody)}`;
      }
      log(logLine);
    }
  });

  next();
});

// Database seeding function
async function seedDatabase() {
  try {
    log("Seeding database configuration assets...");

    // 1. Seed Challenges
    const existingChallenges = await db.select().from(challenges);
    if (existingChallenges.length === 0) {
      log("Seeding challenges table...");
      await db.insert(challenges).values([
        {
          name: "BioSlime Survival",
          description: "Implement an intelligent agent to direct cellular automaton paths to maximize slime survival under toxic environments.",
          complexity: "Hard",
          activeScorers: ["example", "provisional"],
          inputSpec: "Integer seed, 50x50 integer array representing state grid, 200 simulation cycles.",
          outputSpec: "List of move coordinates to steer slime growth vectors."
        },
        {
          name: "AstroRouter Routing",
          description: "Optimize high-throughput low-latency packet routing routes between constellation nodes under solar weather delays.",
          complexity: "Medium",
          activeScorers: ["example"],
          inputSpec: "Node coordinates list, connection speeds matrix, simulated weather degradation maps.",
          outputSpec: "Routing path lists for active data transmission cycles."
        },
        {
          name: "MegaGrid Resource Optimizer",
          description: "Balance dynamic electric grid distribution between nuclear, solar, hydro and battery plants on heavy industrial load surges.",
          complexity: "Expert",
          activeScorers: ["example", "provisional"],
          inputSpec: "Resource generator stats, consumer load lists, historical battery states.",
          outputSpec: "Dynamic generator output percentage settings per load tier."
        }
      ]);
      log("Challenges seeded successfully.");
    }

    // 2. Seed Parameter Store Configurations
    const existingParams = await db.select().from(parameterStore);
    if (existingParams.length === 0) {
      log("Seeding simulated AWS Parameter Store...");
      await db.insert(parameterStore).values([
        {
          key: "SCORING_STRATEGY",
          value: "provisional",
          description: "Active evaluation strategy for running submissions. Values: 'example' (fastest), 'provisional' (standard), or 'both'.",
          type: "String"
        },
        {
          key: "SCORING_TIMEOUT_SEC",
          value: "180",
          description: "Maximum threshold for scoring container lifecycle before invoking timeout abort actions.",
          type: "Integer"
        },
        {
          key: "MAX_CONCURRENT_TASKS",
          value: "5",
          description: "Maximum allowable parallel ECS Fargate container runners. Throttles solutions in queue when capacity exceeded.",
          type: "Integer"
        },
        {
          key: "FARGATE_STARTUP_DELAY_MS",
          value: "4000",
          description: "Simulation speed factor: Simulated boot time for ECR download & Fargate container allocation.",
          type: "Integer"
        },
        {
          key: "TEST_CASE_COUNT",
          value: "100",
          description: "Total evaluation iterations generated for provisional scoring stages.",
          type: "Integer"
        }
      ]);
      log("AWS Parameter Store seeded successfully.");
    }

    // 3. Seed initial Infrastructure Metrics
    const existingMetrics = await db.select().from(infraMetrics);
    if (existingMetrics.length === 0) {
      log("Seeding baseline systems metrics...");
      await db.insert(infraMetrics).values([
        {
          activeFargateTasks: 0,
          kafkaQueueLength: 0,
          successRate: 99.1,
          costSavings: 82.3,
          cpuUtilization: 4.8,
          memoryUtilization: 12.1,
          apiLatencyMs: 14,
        }
      ]);
      log("Metrics seeded successfully.");
    }

  } catch (err) {
    console.error("[SEED ERROR] Failed to seed database:", err);
  }
}

async function startServer() {
  await initializeDatabase();
  const httpServer = await registerRoutes(app);

  // Seeding
  await seedDatabase();

  // Express Global Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Setup Hot reloading in dev, serve built assets in prod
  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  const PORT = Number(process.env.PORT || 5000);
  httpServer.listen(PORT, "0.0.0.0", () => {
    log(`[SERVER RUNNING] Cockpit platform active at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("[FATAL ENGINE ERROR] Server failed to start:", err);
  process.exit(1);
});
