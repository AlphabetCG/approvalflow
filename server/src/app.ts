import fs from "node:fs";
import path from "node:path";
import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import type { Config } from "./config";
import { HttpError } from "./http";
import { apiRouter } from "./routes";

export interface AppDeps {
  config: Config;
  checkDb: () => Promise<void>;
}

export function createApp({ config, checkDb }: AppDeps) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  if (config.corsOrigins.length > 0) {
    app.use(cors({ origin: config.corsOrigins, credentials: true }));
  }

  // Liveness: the process is up.
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Readiness: the database can be reached. The smoke test calls it after every deploy.
  app.get("/api/ready", async (_req, res) => {
    try {
      await checkDb();
      res.json({ status: "ready", db: "connected" });
    } catch {
      res.status(503).json({ status: "not_ready", db: "disconnected" });
    }
  });

  app.use("/api", apiRouter);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "NOT_FOUND", message: "Unknown API route" });
  });

  // In production the same container serves the built React app.
  const clientDist = path.resolve(process.cwd(), config.clientDist);
  if (fs.existsSync(path.join(clientDist, "index.html"))) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.code, message: err.message });
      return;
    }
    // Malformed JSON body from express.json().
    if (err?.type === "entity.parse.failed") {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Unexpected server error" });
  };
  app.use(errorHandler);

  return app;
}
