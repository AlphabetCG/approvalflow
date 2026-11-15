import fs from "node:fs";
import path from "node:path";

// Load server/.env.test when it exists. CI sets DATABASE_URL directly instead.
export function loadTestEnv(): void {
  const file = path.resolve(__dirname, "../../.env.test");
  if (fs.existsSync(file)) {
    process.loadEnvFile(file);
  }
}

// Only these hosts may be wiped. CI that reaches PostgreSQL by another name
// (e.g. a service container called "db") adds it via TEST_DB_HOSTS=db,other.
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

// The test setup deletes all data, so refuse anything that is not a local test database.
export function assertTestDatabase(
  url = process.env.DATABASE_URL,
  extraHosts = process.env.TEST_DB_HOSTS,
): void {
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy server/.env.test.example to server/.env.test.");
  }
  const parsed = new URL(url);
  const dbName = decodeURIComponent(parsed.pathname.slice(1));
  if (!/(^|_)test$/.test(dbName)) {
    throw new Error(
      `Refusing to run tests against database "${dbName}": its name must be "test" or end with "_test".`,
    );
  }
  const allowed = [
    ...LOCAL_HOSTS,
    ...(extraHosts ?? "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean),
  ];
  if (!allowed.includes(parsed.hostname.toLowerCase())) {
    throw new Error(
      `Refusing to run tests against host "${parsed.hostname}": only ${allowed.join(", ")} allowed (add more with TEST_DB_HOSTS).`,
    );
  }
}

// Postgres schema named in DATABASE_URL (?schema=...), "public" by default.
export function testDbSchema(url = process.env.DATABASE_URL): string {
  return new URL(url ?? "").searchParams.get("schema") || "public";
}

loadTestEnv();
