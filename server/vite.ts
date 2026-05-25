import express, { Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const viteLogger = createLogger();

export function log(message: string) {
  const formatted = `[${new Date().toLocaleTimeString()}] ${message}`;
  console.log(formatted);
}

export async function setupVite(app: Express, server: Server) {
  log("Initializing Vite dev middleware integration...");
  
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: viteLogger,
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    
    // Ignore api routes
    if (url.startsWith("/api")) {
      return next();
    }

    try {
      const clientIndex = path.resolve(__dirname, "..", "client", "index.html");
      let template = fs.readFileSync(clientIndex, "utf-8");
      
      // Inject HMR handles & transform index.html
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");
  
  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find production build directory at: ${distPath}. Make sure to build client assets first.`);
  }

  // Serve asset folders
  app.use(express.static(distPath));

  // Forward everything else to index.html
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
