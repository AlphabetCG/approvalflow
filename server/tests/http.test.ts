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
apiRouter.use("/__probe", probe);

const app = createApp({
  config: loadConfig({ CLIENT_DIST: "does-not-exist" }),
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
