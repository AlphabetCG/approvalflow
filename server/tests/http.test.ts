import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config";
import { conflict, forbidden } from "../src/http";
import { apiRouter } from "../src/routes";

// Mount throwaway routes on the shared router to exercise the error handler.
const probe = express.Router();
probe.get("/forbidden", () => {
  throw forbidden("Reviewers only");
});
probe.get("/conflict", async () => {
  throw conflict("Already decided");
});
probe.get("/boom", () => {
  throw new Error("unexpected");
});
probe.get("/items/:id", (req, res) => {
  res.json({ id: req.params.id });
});
apiRouter.use("/__probe", probe);

const app = createApp({
  config: loadConfig({ CLIENT_DIST: "does-not-exist", CORS_ORIGIN: "http://web.test" }),
  checkDb: async () => {},
});

describe("HttpError handling", () => {
  it("maps a thrown HttpError to its status and JSON body", async () => {
    const res = await request(app).get("/api/__probe/forbidden");
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "FORBIDDEN", message: "Reviewers only" });
  });

  it("handles errors thrown from async handlers", async () => {
    const res = await request(app).get("/api/__probe/conflict");
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("CONFLICT");
  });

  it("hides unexpected errors behind a generic 500", async () => {
    const res = await request(app).get("/api/__probe/boom");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "INTERNAL_ERROR", message: "Unexpected server error" });
  });
});

describe("client errors from Express and body-parser", () => {
  it("rejects a body over 1 MB with 413", async () => {
    const res = await request(app)
      .post("/api/__probe/items/1")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ text: "x".repeat(1024 * 1024 + 1) }));
    expect(res.status).toBe(413);
    expect(res.body.error).toBe("PAYLOAD_TOO_LARGE");
  });

  it("rejects an unsupported charset with 415", async () => {
    const res = await request(app)
      .post("/api/__probe/items/1")
      .set("Content-Type", "application/json; charset=klingon")
      .send("{}");
    expect(res.status).toBe(415);
    expect(res.body.error).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("rejects an undecodable URL param with 400", async () => {
    const res = await request(app).get("/api/__probe/items/%E0%A4%A");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "VALIDATION_ERROR", message: "Bad request" });
  });

  it("keeps CORS headers on a malformed JSON error", async () => {
    const res = await request(app)
      .post("/api/__probe/items/1")
      .set("Origin", "http://web.test")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(res.status).toBe(400);
    expect(res.headers["access-control-allow-origin"]).toBe("http://web.test");
  });
});
