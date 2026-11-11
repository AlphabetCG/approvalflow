import express from "express";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { requireRole } from "../src/auth/middleware";
import { hashToken } from "../src/auth/session";
import { loadConfig } from "../src/config";
import { checkDatabase } from "../src/db";
import { apiRouter } from "../src/routes";
import { seedDemoUsers } from "../src/seed/demo-users";
import { createUser, loginAs } from "./helpers/auth";
import { prisma, resetDb } from "./helpers/db";

// A route that only reviewers may use, to exercise requireRole (T-01-09).
const probe = express.Router();
probe.get("/reviewers-only", requireRole("REVIEWER"), (_req, res) => {
  res.json({ ok: true });
});
apiRouter.use("/__auth-probe", probe);

const app = createApp({
  config: loadConfig({ CLIENT_DIST: "does-not-exist", NODE_ENV: "test" }),
  checkDb: checkDatabase,
});

const sessionCookie = (res: request.Response): string | undefined =>
  ([] as string[]).concat(res.headers["set-cookie"] ?? []).find((c) => c.startsWith("af_session="));

const cookieToken = (cookie: string): string => decodeURIComponent(cookie.split(";")[0].split("=")[1]);

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("POST /api/auth/login", () => {
  // T-01-04 (AC-01-1)
  it("signs in with the right password and /me returns the same user", async () => {
    const user = await createUser({ name: "Alice", role: "REQUESTER" });
    const agent = request.agent(app);

    const res = await agent.post("/api/auth/login").send({ email: user.email, password: user.password });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      id: user.id,
      email: user.email,
      name: "Alice",
      role: "REQUESTER",
      department: user.department,
    });
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
    const cookie = sessionCookie(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(user.id);
  });

  // T-01-05 (AC-01-2)
  it("gives the same 401 for a wrong password and an unknown email, without a cookie", async () => {
    const user = await createUser();
    const wrongPassword = await request(app).post("/api/auth/login").send({ email: user.email, password: "nope-nope" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: user.password });

    for (const res of [wrongPassword, unknownEmail]) {
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "INVALID_CREDENTIALS", message: "Email or password is incorrect" });
      expect(sessionCookie(res)).toBeUndefined();
    }
    expect(await prisma.session.count()).toBe(0);
  });

  // T-01-06 (AC-01-3)
  it.each([[{}], [{ email: "", password: "" }], [{ email: "a@example.com" }], [{ email: 1, password: 2 }]])(
    "rejects the body %j with 400",
    async (body) => {
      const res = await request(app).post("/api/auth/login").send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("VALIDATION_ERROR");
    },
  );

  // T-01-11 (AC-01-8)
  it("treats email case and surrounding spaces as the same email", async () => {
    const user = await createUser({ email: "alice@example.com" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "  Alice@Example.COM ", password: user.password });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("alice@example.com");
  });
});

describe("GET /api/auth/me", () => {
  // T-01-07 (AC-01-4)
  it("returns 401 without a cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("UNAUTHENTICATED");
    expect(res.body.user).toBeUndefined();
  });

  it("returns 401 for an unknown token", async () => {
    const res = await request(app).get("/api/auth/me").set("Cookie", "af_session=garbage");
    expect(res.status).toBe(401);
  });

  it("returns 401 for an expired session and deletes it", async () => {
    const user = await createUser();
    const agent = request.agent(app);
    await loginAs(agent, user);
    await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await agent.get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(await prisma.session.count()).toBe(0);
  });
});

describe("POST /api/auth/logout", () => {
  // T-01-08 (AC-01-5)
  it("deletes the session so the old cookie no longer works", async () => {
    const user = await createUser();
    const login = await request(app).post("/api/auth/login").send({ email: user.email, password: user.password });
    const cookie = sessionCookie(login)!.split(";")[0];

    const res = await request(app).post("/api/auth/logout").set("Cookie", cookie);

    expect(res.status).toBe(204);
    expect(sessionCookie(res)).toMatch(/af_session=;/);
    expect(await prisma.session.count()).toBe(0);
    const me = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(me.status).toBe(401);
  });

  it("is idempotent without a session", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(204);
  });
});

describe("requireRole", () => {
  // T-01-09 (AC-01-6)
  it("lets a reviewer through, forbids a requester, and rejects anonymous callers", async () => {
    const reviewer = request.agent(app);
    await loginAs(reviewer, await createUser({ role: "REVIEWER" }));
    const requester = request.agent(app);
    await loginAs(requester, await createUser({ role: "REQUESTER" }));

    expect((await reviewer.get("/api/__auth-probe/reviewers-only")).status).toBe(200);
    const forbidden = await requester.get("/api/__auth-probe/reviewers-only");
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error).toBe("FORBIDDEN");
    expect((await request(app).get("/api/__auth-probe/reviewers-only")).status).toBe(401);
  });
});

describe("stored credentials", () => {
  // T-01-10 (AC-01-7)
  it("keeps only a bcrypt hash and never the raw session token", async () => {
    const user = await createUser();
    const login = await request(app).post("/api/auth/login").send({ email: user.email, password: user.password });
    const token = cookieToken(sessionCookie(login)!);

    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored.passwordHash).not.toContain(user.password);

    const sessions = await prisma.session.findMany();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).not.toBe(token);
    expect(sessions[0].id).toBe(hashToken(token));
  });

  it("the database rejects an email that is not lower case", async () => {
    await expect(
      prisma.user.create({
        data: { email: "Bob@Example.com", name: "Bob", passwordHash: "x", role: "REQUESTER", department: "X" },
      }),
    ).rejects.toThrow(/User_email_normalized/);
  });
});

describe("seedDemoUsers", () => {
  // T-01-12 (AC-01-10)
  it("creates the demo users once, even when run twice", async () => {
    const env = { DEMO_USER_PASSWORD: "demo-password-123" };
    const first = await seedDemoUsers(prisma, env);
    const countAfterFirst = await prisma.user.count();
    const second = await seedDemoUsers(prisma, env);

    expect(first).toEqual({ created: 7, skipped: false });
    expect(second).toEqual({ created: 0, skipped: false });
    expect(countAfterFirst).toBe(7);
    expect(await prisma.user.count()).toBe(7);
  });

  it("has at least 2 reviewers in every department that has requesters (D-01)", async () => {
    await seedDemoUsers(prisma, { DEMO_USER_PASSWORD: "demo-password-123" });
    const users = await prisma.user.findMany();
    for (const dept of new Set(users.filter((u) => u.role === "REQUESTER").map((u) => u.department))) {
      expect(users.filter((u) => u.department === dept && u.role === "REVIEWER").length).toBeGreaterThanOrEqual(2);
    }
  });

  it("lets a seeded user log in with the password from the environment", async () => {
    await seedDemoUsers(prisma, { DEMO_USER_PASSWORD: "demo-password-123" });
    const anyUser = await prisma.user.findFirstOrThrow();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: anyUser.email, password: "demo-password-123" });
    expect(res.status).toBe(200);
  });

  it("creates no users without DEMO_USER_PASSWORD", async () => {
    expect(await seedDemoUsers(prisma, {})).toEqual({ created: 0, skipped: true });
    expect(await prisma.user.count()).toBe(0);
  });

  it("refuses a DEMO_USER_PASSWORD shorter than 8 characters", async () => {
    await expect(seedDemoUsers(prisma, { DEMO_USER_PASSWORD: "short" })).rejects.toThrow(/at least 8/);
  });
});
