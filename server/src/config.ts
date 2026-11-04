// Every setting comes from the environment (documented in server/.env.example).
export interface Config {
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
  clientDist: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT: ${env.PORT}`);
  }
  return {
    nodeEnv: env.NODE_ENV ?? "development",
    port,
    corsOrigins: (env.CORS_ORIGIN ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    clientDist: env.CLIENT_DIST ?? "../client/dist",
  };
}
