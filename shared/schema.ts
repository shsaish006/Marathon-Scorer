import { pgTable, serial, text, varchar, integer, doublePrecision, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Challenges table
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  complexity: varchar("complexity", { length: 50 }).notNull(), // 'Medium', 'Hard', 'Expert'
  activeScorers: jsonb("active_scorers").$type<string[]>().default(["example", "provisional"]).notNull(),
  inputSpec: text("input_spec").notNull(),
  outputSpec: text("output_spec").notNull(),
});

// Submissions table
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").references(() => challenges.id).notNull(),
  language: varchar("language", { length: 50 }).notNull(),
  code: text("code").notNull(),
  status: varchar("status", { length: 50 }).default("submitted").notNull(), // 'submitted', 'running_examples', 'running_provisional', 'completed', 'failed'
  score: doublePrecision("score").default(0.0).notNull(),
  processingTimeMs: integer("processing_time_ms").default(0).notNull(),
  activeScorer: varchar("active_scorer", { length: 50 }), // 'example', 'provisional'
  logs: jsonb("logs").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Parameter Store configuration
export const parameterStore = pgTable("parameter_store", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: text("value").notNull(),
  description: text("description").notNull(),
  type: varchar("type", { length: 50 }).default("String").notNull(), // 'String', 'SecureString', 'Integer'
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// System infrastructure performance metrics history
export const infraMetrics = pgTable("infra_metrics", {
  id: serial("id").primaryKey(),
  activeFargateTasks: integer("active_fargate_tasks").default(0).notNull(),
  kafkaQueueLength: integer("kafka_queue_length").default(0).notNull(),
  successRate: doublePrecision("success_rate").default(100.0).notNull(),
  costSavings: doublePrecision("cost_savings").default(80.0).notNull(),
  cpuUtilization: doublePrecision("cpu_utilization").default(0.0).notNull(),
  memoryUtilization: doublePrecision("memory_utilization").default(0.0).notNull(),
  apiLatencyMs: integer("api_latency_ms").default(25).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// Zod validation schemas
export const insertChallengeSchema = createInsertSchema(challenges);
export const selectChallengeSchema = createSelectSchema(challenges);

export const insertSubmissionSchema = createInsertSchema(submissions);
export const selectSubmissionSchema = createSelectSchema(submissions);

export const insertParameterSchema = createInsertSchema(parameterStore);
export const selectParameterSchema = createSelectSchema(parameterStore);

export const insertInfraMetricsSchema = createInsertSchema(infraMetrics);
export const selectInfraMetricsSchema = createSelectSchema(infraMetrics);

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

export type ParameterStore = typeof parameterStore.$inferSelect;
export type InsertParameterStore = typeof parameterStore.$inferInsert;

export type InfraMetrics = typeof infraMetrics.$inferSelect;
export type InsertInfraMetrics = typeof infraMetrics.$inferInsert;
