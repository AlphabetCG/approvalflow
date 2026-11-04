import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config";

const config = loadConfig({ PORT: "3000", CLIENT_DIST: "does-not-exist" });
const dbUp = async () => {};
const dbDown = async () => {
  throw new Error("connection refused");
};

describe("health and readiness", () => {
  it("GET /api/health returns ok", async () => {
    const res = await request(createApp({ config, checkDb: dbUp })).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /api/ready reports connected when the database answers", async () => {
    const res = await request(createApp({ config, checkDb: dbUp })).get("/api/ready");
    expect(res.status).toBe(200);
    expect(res.body.db).toBe("connected");
  });

  it("GET /api/ready returns 503 when the database is unreachable", async () => {
    const res = await request(createApp({ config, checkDb: dbDown })).get("/api/ready");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("not_ready");
  });

  it("unknown API routes return a JSON 404", async () => {
    const res = await request(createApp({ config, checkDb: dbUp })).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "NOT_FOUND" });
  });
});

describe("config", () => {
  it("rejects an invalid PORT", () => {
    expect(() => loadConfig({ PORT: "abc" })).toThrow(/Invalid PORT/);
  });

  it("reads comma-separated CORS origins", () => {
    const c = loadConfig({ CORS_ORIGIN: "http://a.test, http://b.test" });
    expect(c.corsOrigins).toEqual(["http://a.test", "http://b.test"]);
  });
});
