// Before the run: migrate the test database, empty it, and seed the demo users
// and sample requests with the E2E password. Refuses a non-test database.
import { execSync } from "node:child_process";
import path from "node:path";
import { DATABASE_URL, DEMO_USER_PASSWORD } from "./playwright.config";

function assertLocalTestDatabase(url: string): void {
  const parsed = new URL(url);
  const db = decodeURIComponent(parsed.pathname.slice(1));
  if (!/(^|_)test$/.test(db) || !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)) {
    throw new Error(`E2E refuses to wipe "${db}" on "${parsed.hostname}": use a local *_test database.`);
  }
}

export default function globalSetup(): void {
  assertLocalTestDatabase(DATABASE_URL);
  const server = path.resolve(__dirname, "../server");
  const env = { ...process.env, DATABASE_URL, DEMO_USER_PASSWORD };
  const run = (cmd: string, input?: string) => execSync(cmd, { cwd: server, env, input, stdio: "pipe" });

  run("npx prisma migrate deploy");
  run(
    "npx prisma db execute --stdin --schema prisma/schema.prisma",
    'TRUNCATE TABLE "RequestHistory", "Request", "Session", "User" RESTART IDENTITY CASCADE;',
  );
  run("npm run prisma:seed");
}
