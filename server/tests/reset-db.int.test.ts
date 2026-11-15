import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma, resetDb } from "./helpers/db";

// No Prisma models exist yet, so use a throwaway table to prove resetDb() empties real tables.
afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "reset_probe"`);
  await prisma.$disconnect();
});

describe("resetDb()", () => {
  it("empties every table and restarts identities", async () => {
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "reset_probe" (id SERIAL PRIMARY KEY, note TEXT NOT NULL)`,
    );
    await prisma.$executeRawUnsafe(`INSERT INTO "reset_probe" (note) VALUES ('a'), ('b')`);

    await resetDb();

    const [{ count }] = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) AS count FROM "reset_probe"`;
    expect(count).toBe(0n);
    const [{ id }] = await prisma.$queryRaw<{ id: number }[]>`
      INSERT INTO "reset_probe" (note) VALUES ('c') RETURNING id`;
    expect(id).toBe(1);
  });

  it("refuses to run when DATABASE_URL is not a test database", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost:5433/approvalflow");
    try {
      await expect(resetDb()).rejects.toThrow(/Refusing/);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
