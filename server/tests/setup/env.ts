import fs from "node:fs";
import path from "node:path";

// Load server/.env.test when it exists. CI sets DATABASE_URL directly instead.
export function loadTestEnv(): void {
  const file = path.resolve(__dirname, "../../.env.test");
  if (fs.existsSync(file)) {
    process.loadEnvFile(file);
  }
}

// The test setup deletes all data, so refuse anything that is not a test database.
export function assertTestDatabase(url = process.env.DATABASE_URL): void {
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy server/.env.test.example to server/.env.test.");
  }
  const dbName = new URL(url).pathname.slice(1);
  if (!dbName.includes("test")) {
    throw new Error(`Refusing to run tests against database "${dbName}": its name must contain "test".`);
  }
}

loadTestEnv();
