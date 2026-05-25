import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "../shared/schema";
import fs from "fs";
import path from "path";

// Configure neon serverless to use ws for local node environments
neonConfig.webSocketConstructor = ws;

// 1. Proactively attempt to load DATABASE_URL from a local .env file if present
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      const match = envContent.match(/DATABASE_URL=["']?([^"'\s#]+)["']?/);
      if (match) {
        process.env.DATABASE_URL = match[1];
      }
    }
  } catch (e) {
    // Suppress local file read errors
  }
}

let dbInstance: any = null;
let poolInstance: any = null;
let isInMemoryMode = false;

// Helper to extract values from complex Drizzle where clauses recursively
function extractWhereValue(whereClause: any): { field?: string, value?: any } {
  if (!whereClause) return {};
  if (whereClause.field && whereClause.value !== undefined) {
    return { field: whereClause.field, value: whereClause.value };
  }

  let value: any = undefined;
  let field: string | undefined = undefined;

  const inspect = (obj: any) => {
    if (!obj || typeof obj !== "object") return;
    if (obj.name && typeof obj.name === "string") {
      if (obj.name === "id" || obj.name === "challenge_id" || obj.name === "key") {
        field = obj.name === "challenge_id" ? "challengeId" : obj.name;
      }
    }
    if (obj.value !== undefined) {
      value = obj.value;
    }
    for (const k in obj) {
      if (k === "value") {
        value = obj[k];
      } else if (typeof obj[k] === "object") {
        inspect(obj[k]);
      }
    }
  };

  inspect(whereClause);

  // Fallback: deep search for any primitive value in the Drizzle structure
  if (value === undefined) {
    const searchVal = (obj: any): any => {
      if (!obj || typeof obj !== "object") return;
      for (const k in obj) {
        if (typeof obj[k] === "number" || typeof obj[k] === "string") {
          return obj[k];
        }
        const res = searchVal(obj[k]);
        if (res !== undefined) return res;
      }
    };
    value = searchVal(whereClause);
  }

  return { field, value };
}

// 2. High-Fidelity In-Memory Drizzle Simulator bootstrapper
function bootstrapInMemorySimulator() {
  const memoryStore: Record<string, any[]> = {
    challenges: [],
    submissions: [],
    parameter_store: [],
    parameterStore: [],
    infra_metrics: [],
    infraMetrics: []
  };

  let challengeIdSeq = 1;
  let submissionIdSeq = 1;
  let metricsIdSeq = 1;

  dbInstance = {
    select: () => ({
      from: (tableObj: any) => {
        const tableName = tableObj.key || tableObj._?.name || "challenges";
        let results = [...(memoryStore[tableName] || [])];
        
        const chain = {
          where: (whereClause: any) => {
            const { field, value } = extractWhereValue(whereClause);
            if (field === "id") {
              results = results.filter(item => item.id === value);
            } else if (field === "challengeId") {
              results = results.filter(item => item.challengeId === value);
            } else if (field === "key") {
              results = results.filter(item => item.key === value);
            } else if (value !== undefined) {
              results = results.filter(item => item.id === value || item.challengeId === value || item.key === value);
            }
            return chain;
          },
          orderBy: () => chain,
          limit: (n: number) => {
            results = results.slice(0, n);
            return results;
          },
          then: (resolve: any) => resolve(results)
        };
        
        return Object.assign(Promise.resolve(results), chain);
      }
    }),
    
    insert: (tableObj: any) => ({
      values: (values: any) => {
        const tableName = tableObj.key || tableObj._?.name || "submissions";
        const valArray = Array.isArray(values) ? values : [values];
        const insertedItems: any[] = [];

        for (const val of valArray) {
          const item = { ...val };
          if (tableName === "challenges" && !item.id) {
            item.id = challengeIdSeq++;
          } else if (tableName === "submissions" && !item.id) {
            item.id = submissionIdSeq++;
            item.createdAt = new Date();
            item.logs = item.logs || [];
            item.score = item.score || 0.0;
            item.processingTimeMs = item.processingTimeMs || 0;
            item.status = item.status || "submitted";
          } else if (tableName === "infra_metrics" && !item.id) {
            item.id = metricsIdSeq++;
            item.recordedAt = new Date();
          }
          
          if (!memoryStore[tableName]) {
            memoryStore[tableName] = [];
          }
          memoryStore[tableName].push(item);
          insertedItems.push(item);
        }

        const resultObj = Array.isArray(values) ? insertedItems : insertedItems[0];
        const chain = {
          returning: () => Promise.resolve(resultObj),
          then: (resolve: any) => resolve(resultObj)
        };
        return Object.assign(Promise.resolve(resultObj), chain);
      }
    }),

    update: (tableObj: any) => ({
      set: (updates: any) => ({
        where: (whereClause: any) => {
          const tableName = tableObj.key || tableObj._?.name || "submissions";
          const store = memoryStore[tableName] || [];
          const { field, value } = extractWhereValue(whereClause);
          let updatedItem: any = null;

          for (let i = 0; i < store.length; i++) {
            const matchId = (field === "id" || !field) && store[i].id === value;
            const matchKey = (field === "key" || !field) && store[i].key === value;

            if (matchId || matchKey) {
              store[i] = { ...store[i], ...updates };
              if (updates.updatedAt) store[i].updatedAt = new Date();
              updatedItem = store[i];
            }
          }

          const resultObj = updatedItem ? [updatedItem] : [];
          const chain = {
            returning: () => Promise.resolve(resultObj),
            then: (resolve: any) => resolve(resultObj)
          };
          return Object.assign(Promise.resolve(resultObj), chain);
        }
      })
    }),

    delete: (tableObj: any) => ({
      where: (whereClause: any) => {
        const tableName = tableObj.key || tableObj._?.name || "submissions";
        const store = memoryStore[tableName] || [];
        const { field, value } = extractWhereValue(whereClause);
        
        memoryStore[tableName] = store.filter(item => {
          const matchId = (field === "id" || !field) && item.id === value;
          const matchKey = (field === "key" || !field) && item.key === value;
          return !(matchId || matchKey);
        });
        
        const chain = {
          returning: () => Promise.resolve([]),
          then: (resolve: any) => resolve([])
        };
        return Object.assign(Promise.resolve([]), chain);
      }
    })
  };
}

// Default initialize database to memory simulator in case of early access
bootstrapInMemorySimulator();

// 3. Standalone Database Initialization Probe (avoids Top-Level Await warnings)
export async function initializeDatabase() {
  if (process.env.DATABASE_URL) {
    try {
      poolInstance = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 1500
      });
      
      const client = await poolInstance.connect();
      client.release();
      
      dbInstance = drizzle(poolInstance, { schema });
      console.log("[DATABASE] Connected to PostgreSQL database successfully.");
    } catch (err) {
      console.warn("==========================================================================");
      console.warn("⚠️  [DATABASE CONNECTION REFUSED] Failed to reach PostgreSQL database!");
      console.warn("👉  Bootstrapping Marathon Scorer in High-Fidelity IN-MEMORY SIMULATION MODE");
      console.warn("==========================================================================");
      isInMemoryMode = true;
      bootstrapInMemorySimulator();
      if (poolInstance) {
        try { poolInstance.end(); } catch (e) {}
      }
    }
  } else {
    console.warn("==========================================================================");
    console.warn("⚠️  [DATABASE WARNING] DATABASE_URL environment variable is not defined!");
    console.warn("👉  Bootstrapping Marathon Scorer in High-Fidelity IN-MEMORY SIMULATION MODE");
    console.warn("==========================================================================");
    isInMemoryMode = true;
    bootstrapInMemorySimulator();
  }
}

export const pool = poolInstance;

// 4. Dynamic Proxy Wrapper for DB exporting compatible Drizzle queries
export const db = {
  select: (...args: any[]) => dbInstance.select(...args),
  insert: (...args: any[]) => dbInstance.insert(...args),
  update: (...args: any[]) => dbInstance.update(...args),
  delete: (...args: any[]) => dbInstance.delete(...args),
};

// Helper to check table keys for mock where clauses
export function eq(fieldObj: any, value: any) {
  const fieldName = fieldObj.name || "id";
  return { field: fieldName, value };
}

export function desc(fieldObj: any) {
  return { field: fieldObj.name, direction: "desc" };
}
