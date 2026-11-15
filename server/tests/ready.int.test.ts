import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config";
import { checkDatabase } from "../src/db";
import { prisma, resetDb } from "./helpers/db";

// API + real PostgreSQL integration test (needs the test database running).
const app = createApp({
  config: loadConfig({ CLIENT_DIST: "does-not-exist" }),
  checkDb: checkDatabase,
});

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("GET /api/ready with the real database", () => {
  it("reports the database as connected", async () => {
    const res = await request(app).get("/api/ready");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ready", db: "connected" });
  });
});
