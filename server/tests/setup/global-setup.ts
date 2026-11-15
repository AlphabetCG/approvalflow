import { execSync } from "node:child_process";
import path from "node:path";
import { assertTestDatabase, loadTestEnv, testDbSchema } from "./env";

// Runs once before the integration tests: drop everything in the test schema
// (tables left over from other branches included), then apply the migrations
// of this branch. Data is cleared per test by resetDb() in tests/helpers/db.ts.
//
// Not `prisma migrate reset`: Prisma refuses it when run from an AI agent
// (Claude Code, Cursor, ...), which would break `npm test` for those users.
export default function setup(): void {
  loadTestEnv();
  assertTestDatabase();
  const cwd = path.resolve(__dirname, "../..");
  const schema = testDbSchema().replaceAll('"', '""');
  const run = (cmd: string, input?: string) =>
    execSync(cmd, { cwd, env: process.env, input, stdio: "pipe" });

  run(
    "npx prisma db execute --stdin --schema prisma/schema.prisma",
    `DROP SCHEMA IF EXISTS "${schema}" CASCADE; CREATE SCHEMA "${schema}";`,
  );
  run("npx prisma migrate deploy");
}
