import { prisma } from "../../src/db";
import { assertTestDatabase } from "../setup/env";

// Empty every table (except Prisma's migration log). Call it in beforeEach of
// API/DB integration tests so each test starts from a known state.
export async function resetDb(): Promise<void> {
  assertTestDatabase();
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (rows.length === 0) return;
  const tables = rows.map((r) => `"public"."${r.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}

export { prisma };
