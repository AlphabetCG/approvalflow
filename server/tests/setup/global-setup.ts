import { execSync } from "node:child_process";
import path from "node:path";
import { assertTestDatabase, loadTestEnv } from "./env";

// Runs once before all test files: bring the test database up to the latest
// migration. Data is cleared per test by resetDb() in tests/helpers/db.ts.
export default function setup(): void {
  loadTestEnv();
  assertTestDatabase();
  execSync("npx prisma migrate deploy", {
    cwd: path.resolve(__dirname, "../.."),
    env: process.env,
    stdio: "pipe",
  });
}
