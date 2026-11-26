// Every setting comes from the environment (documented in server/.env.example).
export interface Config {
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
  clientDist: string;
  sessionTtlHours: number;
  // #41: baked into the image at build time (Dockerfile ARG APP_COMMIT).
  commit: string;
  // #41: set by Cloud Run on every revision; absent locally.
  revision: string | null;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT: ${env.PORT}`);
  }
  const sessionTtlHours = Number(env.SESSION_TTL_HOURS ?? 8);
  if (!Number.isFinite(sessionTtlHours) || sessionTtlHours <= 0) {
    throw new Error(`Invalid SESSION_TTL_HOURS: ${env.SESSION_TTL_HOURS}`);
  }
  return {
    nodeEnv: env.NODE_ENV ?? "development",
    port,
    corsOrigins: (env.CORS_ORIGIN ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    clientDist: env.CLIENT_DIST ?? "../client/dist",
    sessionTtlHours,
    commit: env.APP_COMMIT || "unknown",
    revision: env.K_REVISION || null,
  };
}
