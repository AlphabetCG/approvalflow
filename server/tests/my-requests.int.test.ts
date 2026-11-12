// F-03: GET /api/requests/mine and GET /api/requests/:id (contract docs/sprints/sprint-1/F-03.md).
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

// Stored directly, so the test controls submittedAt; same rows as F-02 writes.
async function makeRequest(
  requester: TestUser,
  reviewer: TestUser,
  { title = "Conference travel", submittedAt = new Date("2026-11-12T09:00:00.000Z") } = {},
) {
  return prisma.request.create({
    data: {
      requesterId: requester.id,
      reviewerId: reviewer.id,
      title,
      category: "TRAVEL",
      amount: "1500.00",
      description: "Train tickets to the conference",
      status: "SUBMITTED",
      submittedAt,
      history: {
        create: { actorId: requester.id, action: "SUBMIT", toStatus: "SUBMITTED", createdAt: submittedAt },
      },
    },
  });
}

const ref = (u: TestUser) => ({ id: u.id, email: u.email, name: u.name });
const NOT_FOUND = { error: "NOT_FOUND", message: "Request not found" };

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("GET /api/requests/mine", () => {
  // T-03-01 (AC-03-1)
  it("lists only the requests I submitted, newest first, without description or history", async () => {
    const me = await createUser({ role: "REVIEWER", department: "ENGINEERING" });
    const other = await createUser({ role: "REQUESTER", department: "ENGINEERING" });
    const reviewer = await createUser({ role: "REVIEWER", department: "ENGINEERING" });
    const older = await makeRequest(me, reviewer, { title: "Older", submittedAt: new Date("2026-11-10T09:00:00Z") });
    const newer = await makeRequest(me, reviewer, { title: "Newer", submittedAt: new Date("2026-11-11T09:00:00Z") });
    await makeRequest(other, reviewer, { title: "Someone else's" });
    await makeRequest(other, me, { title: "Assigned to me" });

    const res = await (await signedIn(me)).get("/api/requests/mine");

    expect(res.status).toBe(200);
    expect(res.body.requests.map((r: { id: string }) => r.id)).toEqual([newer.id, older.id]);
    expect(res.body.requests[0]).toEqual({
      id: newer.id,
      title: "Newer",
      category: "TRAVEL",
      amount: "1500.00",
      status: "SUBMITTED",
      submittedAt: "2026-11-11T09:00:00.000Z",
      reviewer: ref(reviewer),
    });
  });

  // T-03-02 (AC-03-2)
  it("returns an empty list when I have no requests", async () => {
    const res = await (await signedIn(await createUser())).get("/api/requests/mine");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ requests: [] });
  });
});

describe("GET /api/requests/:id", () => {
  // T-03-03 (AC-03-3)
  it("shows my own request with its history", async () => {
    const requester = await createUser({ role: "REQUESTER", department: "ENGINEERING" });
    const reviewer = await createUser({ role: "REVIEWER", department: "ENGINEERING" });
    const created = await makeRequest(requester, reviewer);

    const res = await (await signedIn(requester)).get(`/api/requests/${created.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: created.id,
      title: "Conference travel",
      category: "TRAVEL",
      amount: "1500.00",
      description: "Train tickets to the conference",
      status: "SUBMITTED",
      submittedAt: "2026-11-12T09:00:00.000Z",
      requester: ref(requester),
      reviewer: ref(reviewer),
      history: [
        {
          id: expect.any(String),
          action: "SUBMIT",
          fromStatus: null,
          toStatus: "SUBMITTED",
          reason: null,
          createdAt: "2026-11-12T09:00:00.000Z",
          actor: ref(requester),
        },
      ],
    });
  });

  // T-03-04 (AC-03-3)
  it("shows the request to its assigned reviewer", async () => {
    const requester = await createUser({ role: "REQUESTER", department: "ENGINEERING" });
    const reviewer = await createUser({ role: "REVIEWER", department: "ENGINEERING" });
    const created = await makeRequest(requester, reviewer);

    const res = await (await signedIn(reviewer)).get(`/api/requests/${created.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.id);
    expect(res.body.requester).toEqual(ref(requester));
    expect(res.body.history).toHaveLength(1);
  });

  // T-03-05 (AC-03-4, D-10)
  it.each([
    ["another requester", { role: "REQUESTER", department: "ENGINEERING" }],
    ["another reviewer in the same department", { role: "REVIEWER", department: "ENGINEERING" }],
    ["a reviewer in another department", { role: "REVIEWER", department: "FINANCE" }],
  ] as const)("answers 404 to %s, the same as for an unknown id", async (_who, outsider) => {
    const requester = await createUser({ role: "REQUESTER", department: "ENGINEERING" });
    const reviewer = await createUser({ role: "REVIEWER", department: "ENGINEERING" });
    const created = await makeRequest(requester, reviewer);
    const agent = await signedIn(await createUser(outsider));

    const res = await agent.get(`/api/requests/${created.id}`);
    const unknown = await agent.get("/api/requests/cmzzzzzzzzzzzzzzzzzzzzzzz");

    expect(res.status).toBe(404);
    expect(res.body).toEqual(NOT_FOUND);
    expect(unknown.status).toBe(404);
    expect(unknown.body).toEqual(res.body);
    expect(JSON.stringify(res.body)).not.toContain("Conference travel");
  });

  // T-03-06 (AC-03-4)
  it.each(["cmzzzzzzzzzzzzzzzzzzzzzzz", "mine-but-not-really"])("answers 404 for the unknown id %s", async (id) => {
    const res = await (await signedIn(await createUser())).get(`/api/requests/${id}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual(NOT_FOUND);
  });

  // T-03-07 (AC-03-5)
  it("lists every history entry oldest first, with the reason", async () => {
    const requester = await createUser({ role: "REQUESTER", department: "ENGINEERING" });
    const reviewer = await createUser({ role: "REVIEWER", department: "ENGINEERING" });
    const created = await makeRequest(requester, reviewer);
    // F-04 will write decisions; here the row is added the way F-04 stores it.
    await prisma.request.update({ where: { id: created.id }, data: { status: "REJECTED" } });
    await prisma.requestHistory.create({
      data: {
        requestId: created.id,
        actorId: reviewer.id,
        action: "REJECT",
        fromStatus: "SUBMITTED",
        toStatus: "REJECTED",
        reason: "Budget for travel is closed this quarter",
        createdAt: new Date("2026-11-12T10:30:00.000Z"),
      },
    });

    const res = await (await signedIn(requester)).get(`/api/requests/${created.id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("REJECTED");
    expect(res.body.history).toEqual([
      expect.objectContaining({ action: "SUBMIT", fromStatus: null, toStatus: "SUBMITTED", actor: ref(requester) }),
      {
        id: expect.any(String),
        action: "REJECT",
        fromStatus: "SUBMITTED",
        toStatus: "REJECTED",
        reason: "Budget for travel is closed this quarter",
        createdAt: "2026-11-12T10:30:00.000Z",
        actor: ref(reviewer),
      },
    ]);
  });
});

describe("F-03 without a session", () => {
  // T-03-08 (AC-03-6)
  it.each(["/api/requests/mine", "/api/requests/some-id"])("answers 401 on %s", async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("UNAUTHENTICATED");
  });
});
