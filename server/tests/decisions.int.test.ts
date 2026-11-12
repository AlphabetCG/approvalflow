import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config";
import { checkDatabase } from "../src/db";
import { createUser, loginAs, type TestUser } from "./helpers/auth";
import { prisma, resetDb } from "./helpers/db";

const app = createApp({
  config: loadConfig({ CLIENT_DIST: "does-not-exist", NODE_ENV: "test" }),
  checkDb: checkDatabase,
});

async function signedIn(user: TestUser) {
  const agent = request.agent(app);
  await loginAs(agent, user);
  return agent;
}

// A SUBMITTED request with an explicit reviewer and its SUBMIT history row,
// so each test controls the assignment (F-02's round-robin is tested there).
async function makeRequest(
  requester: TestUser,
  reviewer: TestUser,
  overrides: Partial<{ title: string; submittedAt: Date; status: "SUBMITTED" | "APPROVED" | "REJECTED" }> = {},
) {
  return prisma.request.create({
    data: {
      requesterId: requester.id,
      reviewerId: reviewer.id,
      title: overrides.title ?? "Conference travel",
      category: "TRAVEL",
      amount: 1500,
      description: "Train tickets",
      status: overrides.status ?? "SUBMITTED",
      submittedAt: overrides.submittedAt ?? new Date(),
      history: { create: { actorId: requester.id, action: "SUBMIT", toStatus: "SUBMITTED" } },
    },
  });
}

const state = async (id: string) => {
  const r = await prisma.request.findUniqueOrThrow({ where: { id }, include: { history: true } });
  return { status: r.status, decisions: r.history.filter((h) => h.action !== "SUBMIT").length };
};

const unchanged = { status: "SUBMITTED", decisions: 0 };

let requester: TestUser;
let reviewer: TestUser;

beforeEach(async () => {
  await resetDb();
  requester = await createUser({ role: "REQUESTER", department: "ENGINEERING", name: "Anan" });
  reviewer = await createUser({ role: "REVIEWER", department: "ENGINEERING", name: "Chai" });
});
afterAll(() => prisma.$disconnect());

describe("GET /api/reviews/queue", () => {
  // T-04-04 (AC-04-1)
  it("lists only my assigned SUBMITTED requests, oldest first, with the requester", async () => {
    const other = await createUser({ role: "REVIEWER", department: "ENGINEERING" });
    const newer = await makeRequest(requester, reviewer, { title: "Newer", submittedAt: new Date("2026-11-12T10:00Z") });
    const older = await makeRequest(requester, reviewer, { title: "Older", submittedAt: new Date("2026-11-12T08:00Z") });
    await makeRequest(requester, reviewer, { title: "Decided", status: "APPROVED" });
    await makeRequest(requester, other, { title: "Someone else's" });

    const res = await (await signedIn(reviewer)).get("/api/reviews/queue");

    expect(res.status).toBe(200);
    expect(res.body.requests.map((r: { id: string }) => r.id)).toEqual([older.id, newer.id]);
    expect(res.body.requests[0]).toEqual({
      id: older.id,
      title: "Older",
      category: "TRAVEL",
      amount: "1500.00",
      submittedAt: "2026-11-12T08:00:00.000Z",
      requester: { id: requester.id, email: requester.email, name: "Anan" },
    });

    const otherQueue = await (await signedIn(other)).get("/api/reviews/queue");
    expect(otherQueue.body.requests.map((r: { title: string }) => r.title)).toEqual(["Someone else's"]);
  });

  it("returns an empty list when nothing waits for me", async () => {
    const res = await (await signedIn(reviewer)).get("/api/reviews/queue");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ requests: [] });
  });
});

describe("POST /api/requests/:id/approve and /reject", () => {
  // T-04-05 (AC-04-2)
  it.each([
    ["without a comment", undefined, null],
    ["with a comment", { reason: "  Within budget  " }, "Within budget"],
  ])("lets the assigned reviewer approve %s", async (_name, body, storedReason) => {
    const r = await makeRequest(requester, reviewer);
    const agent = await signedIn(reviewer);

    const res = await agent.post(`/api/requests/${r.id}/approve`).send(body ?? {});

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: r.id,
      status: "APPROVED",
      decision: {
        action: "APPROVE",
        fromStatus: "SUBMITTED",
        toStatus: "APPROVED",
        reason: storedReason,
        actor: { id: reviewer.id, email: reviewer.email, name: "Chai" },
      },
    });
    expect(new Date(res.body.decision.createdAt).toISOString()).toBe(res.body.decision.createdAt);
    expect(await state(r.id)).toEqual({ status: "APPROVED", decisions: 1 });
    const queue = await agent.get("/api/reviews/queue");
    expect(queue.body.requests).toEqual([]);
  });

  // T-04-06 (AC-04-3)
  it("lets the assigned reviewer reject with a reason, stored trimmed", async () => {
    const r = await makeRequest(requester, reviewer);

    const res = await (await signedIn(reviewer))
      .post(`/api/requests/${r.id}/reject`)
      .send({ reason: "  Missing receipt, please attach  " });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "REJECTED",
      decision: { action: "REJECT", fromStatus: "SUBMITTED", toStatus: "REJECTED", reason: "Missing receipt, please attach" },
    });
    const history = await prisma.requestHistory.findFirstOrThrow({ where: { requestId: r.id, action: "REJECT" } });
    expect(history).toMatchObject({ actorId: reviewer.id, reason: "Missing receipt, please attach" });
  });

  // T-04-07 (AC-04-4, BR-03)
  it.each([
    ["no reason", {}],
    ["a short reason", { reason: "short" }],
    ["a reason over 1000 characters", { reason: "x".repeat(1001) }],
  ])("rejects a reject with %s (400), changing nothing", async (_name, body) => {
    const r = await makeRequest(requester, reviewer);

    const res = await (await signedIn(reviewer)).post(`/api/requests/${r.id}/reject`).send(body);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
    expect(res.body.details).toEqual([{ field: "reason", message: expect.any(String) }]);
    expect(await state(r.id)).toEqual(unchanged);
  });

  // T-04-08 (AC-04-5, BR-01)
  it.each(["approve", "reject"])("forbids a reviewer to %s their own request", async (action) => {
    const otherReviewer = await createUser({ role: "REVIEWER", department: "ENGINEERING" });
    const own = await makeRequest(reviewer, otherReviewer);

    const res = await (await signedIn(reviewer))
      .post(`/api/requests/${own.id}/${action}`)
      .send({ reason: "Approving my own request" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "FORBIDDEN", message: "You cannot decide on your own request" });
    expect(await state(own.id)).toEqual(unchanged);
  });

  // T-04-09 (AC-04-6, D-13)
  it("answers an unassigned reviewer and an unknown id with the same 404", async () => {
    const r = await makeRequest(requester, reviewer);
    const outsider = await signedIn(await createUser({ role: "REVIEWER", department: "ENGINEERING" }));

    const notMine = await outsider.post(`/api/requests/${r.id}/approve`).send({});
    const unknown = await outsider.post("/api/requests/cmzzzzzzzzzzzzzzzzzzzzzzz/approve").send({});

    expect(notMine.status).toBe(404);
    expect(notMine.body).toEqual({ error: "NOT_FOUND", message: "Request not found" });
    expect(unknown.status).toBe(404);
    expect(unknown.body).toEqual(notMine.body);
    expect(await state(r.id)).toEqual(unchanged);
  });

  // T-04-10 (AC-04-7)
  it("forbids a requester to use the queue or decide, even on their own request", async () => {
    const r = await makeRequest(requester, reviewer);
    const agent = await signedIn(requester);

    expect((await agent.get("/api/reviews/queue")).status).toBe(403);
    expect((await agent.post(`/api/requests/${r.id}/approve`).send({})).status).toBe(403);
    expect((await agent.post(`/api/requests/${r.id}/reject`).send({ reason: "Changed my mind about it" })).status).toBe(403);
    expect(await state(r.id)).toEqual(unchanged);
  });

  it("answers 401 without a session", async () => {
    const r = await makeRequest(requester, reviewer);
    expect((await request(app).get("/api/reviews/queue")).status).toBe(401);
    expect((await request(app).post(`/api/requests/${r.id}/approve`).send({})).status).toBe(401);
    expect((await request(app).post(`/api/requests/${r.id}/reject`).send({ reason: "Not signed in at all" })).status).toBe(401);
    expect(await state(r.id)).toEqual(unchanged);
  });

  // T-04-11 (AC-04-8, BR-02)
  it.each([
    ["approve", "approve", "APPROVED"],
    ["approve", "reject", "APPROVED"],
    ["reject", "approve", "REJECTED"],
    ["reject", "reject", "REJECTED"],
  ])("refuses to %s and then %s again (409), keeping one decision", async (first, second, finalStatus) => {
    const r = await makeRequest(requester, reviewer);
    const agent = await signedIn(reviewer);
    const reason = { reason: "A long enough reason" };

    expect((await agent.post(`/api/requests/${r.id}/${first}`).send(reason)).status).toBe(200);
    const again = await agent.post(`/api/requests/${r.id}/${second}`).send(reason);

    expect(again.status).toBe(409);
    expect(again.body).toEqual({ error: "CONFLICT", message: `This request is already ${finalStatus}` });
    expect(await state(r.id)).toEqual({ status: finalStatus, decisions: 1 });
  });

  // T-04-12 (AC-04-9, BR-07)
  it("lets only one of two simultaneous approvals succeed", async () => {
    const r = await makeRequest(requester, reviewer);
    const [a, b] = [await signedIn(reviewer), await signedIn(reviewer)];

    const results = await Promise.all([
      a.post(`/api/requests/${r.id}/approve`).send({}),
      b.post(`/api/requests/${r.id}/approve`).send({}),
    ]);

    expect(results.map((res) => res.status).sort()).toEqual([200, 409]);
    expect(await state(r.id)).toEqual({ status: "APPROVED", decisions: 1 });
  });
});
