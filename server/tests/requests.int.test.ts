import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config";
import { checkDatabase } from "../src/db";
import { seedDemoRequests } from "../src/seed/demo-requests";
import { seedDemoUsers } from "../src/seed/demo-users";
import { createUser, loginAs, type TestUser } from "./helpers/auth";
import { prisma, resetDb } from "./helpers/db";

const app = createApp({
  config: loadConfig({ CLIENT_DIST: "does-not-exist", NODE_ENV: "test" }),
  checkDb: checkDatabase,
});

const validBody = {
  title: "Conference travel",
  category: "TRAVEL",
  amount: 1500,
  description: "Train tickets to the conference",
};

async function signedIn(user: TestUser) {
  const agent = request.agent(app);
  await loginAs(agent, user);
  return agent;
}

const counts = async () => ({ requests: await prisma.request.count(), history: await prisma.requestHistory.count() });

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("POST /api/requests", () => {
  // T-02-08 (AC-02-1)
  it("stores a valid request as SUBMITTED with one history row", async () => {
    const requester = await createUser({ role: "REQUESTER", department: "ENGINEERING" });
    const reviewer = await createUser({ role: "REVIEWER", department: "ENGINEERING" });
    const agent = await signedIn(requester);

    const res = await agent.post("/api/requests").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: "Conference travel",
      category: "TRAVEL",
      amount: "1500.00",
      description: "Train tickets to the conference",
      status: "SUBMITTED",
      requester: { id: requester.id, email: requester.email },
      reviewer: { id: reviewer.id, email: reviewer.email },
    });
    expect(new Date(res.body.submittedAt).toISOString()).toBe(res.body.submittedAt);

    const stored = await prisma.request.findUniqueOrThrow({ where: { id: res.body.id }, include: { history: true } });
    expect(stored.status).toBe("SUBMITTED");
    expect(stored.amount.toFixed(2)).toBe("1500.00");
    expect(stored.history).toHaveLength(1);
    expect(stored.history[0]).toMatchObject({
      actorId: requester.id,
      action: "SUBMIT",
      fromStatus: null,
      toStatus: "SUBMITTED",
      reason: null,
    });
  });

  // T-02-09 (AC-02-2, AC-02-3)
  it.each([
    ["amount 0", { ...validBody, amount: 0 }, ["amount"]],
    ["amount over 100,000", { ...validBody, amount: 100000.01 }, ["amount"]],
    ["missing title", { ...validBody, title: undefined }, ["title"]],
    ["several problems", { ...validBody, title: "", amount: -5 }, ["amount", "title"]],
  ])("rejects %s with 400 and per-field details, storing nothing", async (_name, body, fields) => {
    await createUser({ role: "REVIEWER" });
    const agent = await signedIn(await createUser());

    const res = await agent.post("/api/requests").send(body);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
    expect(res.body.details.map((d: { field: string }) => d.field).sort()).toEqual(fields);
    expect(await counts()).toEqual({ requests: 0, history: 0 });
  });

  // T-02-10 (AC-02-4)
  it("rejects an anonymous caller with 401, storing nothing", async () => {
    await createUser({ role: "REVIEWER" });
    const res = await request(app).post("/api/requests").send(validBody);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("UNAUTHENTICATED");
    expect(await counts()).toEqual({ requests: 0, history: 0 });
  });

  // T-02-11 (AC-02-5)
  it("gives a reviewer's own request to another reviewer", async () => {
    const reviewerA = await createUser({ role: "REVIEWER", department: "ENGINEERING" });
    const reviewerB = await createUser({ role: "REVIEWER", department: "ENGINEERING" });
    for (const me of [reviewerA, reviewerB]) {
      const res = await (await signedIn(me)).post("/api/requests").send(validBody);
      expect(res.status).toBe(201);
      expect(res.body.reviewer.id).not.toBe(me.id);
    }
  });

  // T-02-12 (AC-02-6)
  it("assigns reviewers of the requester's department in turn", async () => {
    const reviewers = [
      await createUser({ role: "REVIEWER", department: "ENGINEERING" }),
      await createUser({ role: "REVIEWER", department: "ENGINEERING" }),
    ];
    await createUser({ role: "REVIEWER", department: "FINANCE" });
    const [first, second] = reviewers.map((r) => r.id).sort();
    const agent = await signedIn(await createUser({ department: "ENGINEERING" }));

    const assigned: string[] = [];
    for (let i = 0; i < 3; i++) {
      const res = await agent.post("/api/requests").send(validBody);
      expect(res.status).toBe(201);
      assigned.push(res.body.reviewer.id);
    }

    expect(assigned).toEqual([first, second, first]);
  });

  // T-02-13 (AC-02-7)
  it.each([
    ["the department has no reviewer", "REQUESTER" as const],
    ["the requester is the department's only reviewer", "REVIEWER" as const],
  ])("returns 409 when %s, storing nothing", async (_name, role) => {
    await createUser({ role: "REVIEWER", department: "ENGINEERING" });
    const agent = await signedIn(await createUser({ role, department: "FINANCE" }));

    const res = await agent.post("/api/requests").send(validBody);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("CONFLICT");
    expect(await counts()).toEqual({ requests: 0, history: 0 });
  });

  // T-02-14 (AC-02-8)
  it("ignores status, requesterId and reviewerId in the body", async () => {
    const someoneElse = await createUser({ department: "ENGINEERING" });
    const reviewer = await createUser({ role: "REVIEWER", department: "ENGINEERING" });
    const me = await createUser({ department: "ENGINEERING" });
    const agent = await signedIn(me);

    const res = await agent.post("/api/requests").send({
      ...validBody,
      status: "APPROVED",
      requesterId: someoneElse.id,
      reviewerId: someoneElse.id,
    });

    expect(res.status).toBe(201);
    const stored = await prisma.request.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(stored).toMatchObject({ status: "SUBMITTED", requesterId: me.id, reviewerId: reviewer.id });
  });

  // T-02-15 (AC-02-1): the request and its first history row are one transaction.
  it("stores no request when the history insert fails", async () => {
    await createUser({ role: "REVIEWER" });
    const agent = await signedIn(await createUser());
    await prisma.$executeRawUnsafe(`
      CREATE FUNCTION fail_history_insert() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'history insert blocked by test'; END $$`);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER fail_history_insert BEFORE INSERT ON "RequestHistory"
      FOR EACH ROW EXECUTE FUNCTION fail_history_insert()`);
    try {
      const res = await agent.post("/api/requests").send(validBody);
      expect(res.status).toBe(500);
      expect(await counts()).toEqual({ requests: 0, history: 0 });
    } finally {
      await prisma.$executeRawUnsafe(`DROP TRIGGER fail_history_insert ON "RequestHistory"`);
      await prisma.$executeRawUnsafe(`DROP FUNCTION fail_history_insert()`);
    }
  });
});

describe("Request table constraints", () => {
  // T-02-18 (AC-02-2, AC-02-5): the database rejects bad rows even without the API.
  it("rejects an amount outside the BR-04 range", async () => {
    const requester = await createUser();
    const reviewer = await createUser({ role: "REVIEWER" });
    for (const amount of [0, 100000.01]) {
      await expect(
        prisma.request.create({
          data: { ...validBody, category: "TRAVEL", amount, requesterId: requester.id, reviewerId: reviewer.id },
        }),
      ).rejects.toThrow(/Request_amount_range/);
    }
  });

  it("rejects a request reviewed by its own requester", async () => {
    const reviewer = await createUser({ role: "REVIEWER" });
    await expect(
      prisma.request.create({
        data: { ...validBody, category: "TRAVEL", requesterId: reviewer.id, reviewerId: reviewer.id },
      }),
    ).rejects.toThrow(/Request_reviewer_not_requester/);
  });
});

describe("seedDemoRequests", () => {
  // T-02-20 (AC-02-6)
  it("creates the sample requests once, each reviewed within the requester's department", async () => {
    await seedDemoUsers(prisma, { DEMO_USER_PASSWORD: "demo-password-123" });

    const first = await seedDemoRequests(prisma);
    const second = await seedDemoRequests(prisma);

    expect(first.created).toBeGreaterThanOrEqual(3);
    expect(second.created).toBe(0);
    const requests = await prisma.request.findMany({ include: { requester: true, reviewer: true, history: true } });
    expect(requests).toHaveLength(first.created);
    for (const r of requests) {
      expect(r.reviewer.department).toBe(r.requester.department);
      expect(r.reviewerId).not.toBe(r.requesterId);
      expect(r.status).toBe("SUBMITTED");
      expect(r.history).toHaveLength(1);
    }
  });

  it("creates nothing when the demo users do not exist", async () => {
    expect(await seedDemoRequests(prisma)).toEqual({ created: 0 });
    expect(await prisma.request.count()).toBe(0);
  });
});
