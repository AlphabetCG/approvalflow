import { createApp } from "./app";
import { loadConfig } from "./config";
import { checkDatabase, prisma } from "./db";

const config = loadConfig();
const app = createApp({ config, checkDb: checkDatabase });

// Bind to all interfaces: Cloud Run routes traffic to $PORT from outside the container.
const server = app.listen(config.port, "0.0.0.0", () => {
  console.log(`Server listening on port ${config.port} (${config.nodeEnv})`);
});

// Cloud Run sends SIGTERM before stopping an instance.
process.on("SIGTERM", () => {
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
});
