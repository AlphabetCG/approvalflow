import fs from "node:fs";
import path from "node:path";
import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { loadSessionUser } from "./auth/middleware";
import type { Config } from "./config";
import { authRouter } from "./routes/auth";
import { HttpError } from "./http";
import { apiRouter } from "./routes";

const CLIENT_ERROR_CODES: Record<number, string> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  415: "UNSUPPORTED_MEDIA_TYPE",
};

export interface AppDeps {
  config: Config;
  checkDb: () => Promise<void>;
}

export function createApp({ config, checkDb }: AppDeps) {
  const app = express();
  app.disable("x-powered-by");
  // CORS first, so error responses (e.g. a bad JSON body) still carry its headers.
  if (config.corsOrigins.length > 0) {
    app.use(cors({ origin: config.corsOrigins, credentials: true }));
  }
  app.use(express.json({ limit: "1mb" }));

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

  // F-01: read the session cookie once, so every route below can use req.user.
  app.use("/api", cookieParser(), loadSessionUser);
  app.use("/api/auth", authRouter(config));
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

  const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    // Too late to send JSON; let Express close the connection.
    if (res.headersSent) {
      next(err);
      return;
    }
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.code, message: err.message });
      return;
    }
    // Client errors from Express and body-parser (bad JSON, body too large,
    // unsupported charset, undecodable URL param, ...) carry a 4xx status.
    const status = Number(err?.status ?? err?.statusCode);
    if (Number.isInteger(status) && status >= 400 && status < 500) {
      const message =
        err.type === "entity.parse.failed"
          ? "Invalid JSON body"
          : err.expose && typeof err.message === "string"
            ? err.message
            : "Bad request";
      res.status(status).json({ error: CLIENT_ERROR_CODES[status] ?? "BAD_REQUEST", message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Unexpected server error" });
  };
  app.use(errorHandler);

  return app;
}
