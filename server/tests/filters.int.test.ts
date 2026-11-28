// F-08: filters on GET /api/requests/mine and GET /api/reviews/queue
// (contract docs/sprints/sprint-2/F-08.md v1.1, D-24..D-28).
import type { RequestCategory, RequestStatus } from "@prisma/client";
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

// Stored directly, so the test controls status, category and submittedAt.
async function makeRequest(
  requester: TestUser,
  reviewer: TestUser,
  {
    title = "Conference travel",
    category = "TRAVEL" as RequestCategory,
    status = "SUBMITTED" as RequestStatus,
    submittedAt = new Date("2026-11-12T09:00:00.000Z"),
  } = {},
) {
  return prisma.request.create({
    data: {
      requesterId: requester.id,
      reviewerId: reviewer.id,
      title,
      category,
      amount: "1500.00",
      description: "Filter test request",
      status,
      submittedAt,
      history: {
        create: { actorId: requester.id, action: "SUBMIT", toStatus: "SUBMITTED", createdAt: submittedAt },
      },
    },
  });
}

const ids = (res: request.Response) => res.body.requests.map((r: { id: string }) => r.id);
const fields = (res: request.Response) => res.body.details.map((d: { field: string }) => d.field);

// A Bangkok wall-clock time (UTC+7, D-26) as an instant.
const bkk = (local: string) => new Date(`${local}+07:00`);

let a: TestUser;
let b: TestUser;
let reviewer: TestUser;

beforeEach(async () => {
  await resetDb();
  a = await createUser({ role: "REQUESTER", department: "ENGINEERING" });
  b = await createUser({ role: "REQUESTER", department: "ENGINEERING" });
  reviewer = await createUser({ role: "REVIEWER", department: "ENGINEERING" });
});
afterAll(() => prisma.$disconnect());

describe("GET /api/requests/mine with filters (F-08)", () => {
  // T-08-02 (AC-08-1)
  it("filters my requests by status", async () => {
    await makeRequest(a, reviewer, { status: "SUBMITTED" });
    const approved = await makeRequest(a, reviewer, { status: "APPROVED" });
    await makeRequest(a, reviewer, { status: "REJECTED" });
    await makeRequest(b, reviewer, { status: "APPROVED" });

    const res = await (await signedIn(a)).get("/api/requests/mine?status=APPROVED");

    expect(res.status).toBe(200);
    expect(ids(res)).toEqual([approved.id]);
  });

  // T-08-03 (AC-08-2)
  it("filters my requests by category, newest first", async () => {
    const older = await makeRequest(a, reviewer, { category: "TRAVEL", submittedAt: new Date("2026-11-10T09:00:00Z") });
    await makeRequest(a, reviewer, { category: "SUPPLIES", submittedAt: new Date("2026-11-11T09:00:00Z") });
    const newer = await makeRequest(a, reviewer, { category: "TRAVEL", submittedAt: new Date("2026-11-12T09:00:00Z") });

    const res = await (await signedIn(a)).get("/api/requests/mine?category=TRAVEL");

    expect(res.status).toBe(200);
    expect(ids(res)).toEqual([newer.id, older.id]);
  });

  // T-08-04 (AC-08-3) — inclusive Bangkok days on submittedAt (D-26).
  it("filters by submitted date range, inclusive Bangkok days", async () => {
    const before = await makeRequest(a, reviewer, { title: "before", submittedAt: bkk("2026-11-09T23:59:59.999") });
    const first = await makeRequest(a, reviewer, { title: "first", submittedAt: bkk("2026-11-10T00:00:00.000") });
    const last = await makeRequest(a, reviewer, { title: "last", submittedAt: bkk("2026-11-20T23:59:59.999") });
    const after = await makeRequest(a, reviewer, { title: "after", submittedAt: bkk("2026-11-21T00:00:00.000") });
    const agent = await signedIn(a);

    const both = await agent.get("/api/requests/mine?from=2026-11-10&to=2026-11-20");
    const fromOnly = await agent.get("/api/requests/mine?from=2026-11-10");
    const toOnly = await agent.get("/api/requests/mine?to=2026-11-20");

    expect(both.status).toBe(200);
    expect(ids(both)).toEqual([last.id, first.id]);
    expect(ids(fromOnly)).toEqual([after.id, last.id, first.id]);
    expect(ids(toOnly)).toEqual([last.id, first.id, before.id]);
  });

  // T-08-05 (AC-08-4)
  it("combines filters with AND, and treats empty values as no filter", async () => {
    const wanted = await makeRequest(a, reviewer, { status: "APPROVED", category: "TRAVEL" });
    await makeRequest(a, reviewer, { status: "APPROVED", category: "SUPPLIES" });
    await makeRequest(a, reviewer, { status: "SUBMITTED", category: "TRAVEL" });
    const agent = await signedIn(a);

    const combined = await agent.get("/api/requests/mine?status=APPROVED&category=TRAVEL");
    const empty = await agent.get("/api/requests/mine?status=&category=&from=&to=");
    const all = await agent.get("/api/requests/mine");

    expect(ids(combined)).toEqual([wanted.id]);
    expect(empty.status).toBe(200);
    expect(empty.body).toEqual(all.body);
    expect(all.body.requests).toHaveLength(3);
  });

  // T-08-06 (AC-08-5, D-28)
  it.each([
    ["status=PAID", "status", "Status must be one of: SUBMITTED, APPROVED, REJECTED"],
    ["category=travel", "category", "Category must be one of: TRAVEL, SUPPLIES, EQUIPMENT, TRAINING, OTHER"],
    ["from=2026-02-30", "from", "From must be a date (YYYY-MM-DD)"],
    ["to=20-11-2026", "to", "To must be a date (YYYY-MM-DD)"],
    ["from=2026-11-21&to=2026-11-20", "to", "To must not be before From"],
    ["status=APPROVED&status=REJECTED", "status", "Status can be given only once"],
  ])("answers 400 for ?%s", async (query, field, message) => {
    const res = await (await signedIn(a)).get(`/api/requests/mine?${query}`);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "VALIDATION_ERROR", message, details: [{ field, message }] });
  });

  // T-08-06 (AC-08-5) — one entry per bad field; an impossible date gives no extra "before" error.
  it("lists every bad field once", async () => {
    const res = await (await signedIn(a)).get("/api/requests/mine?status=PAID&from=2026-02-30&to=2026-01-01");

    expect(res.status).toBe(400);
    expect(fields(res)).toEqual(["status", "from"]);
  });

  // T-08-07 (AC-08-6, NFR-03) — guard: passes before and after the change.
  it("never returns another user's request, whatever the filters", async () => {
    const mine = await makeRequest(a, reviewer, { status: "APPROVED", category: "TRAVEL" });
    await makeRequest(b, reviewer, { status: "APPROVED", category: "TRAVEL" });

    const res = await (await signedIn(a)).get(
      `/api/requests/mine?status=APPROVED&category=TRAVEL&from=2026-11-01&to=2026-11-30&requesterId=${b.id}`,
    );

    expect(res.status).toBe(200);
    expect(ids(res)).toEqual([mine.id]);
  });
});

describe("GET /api/reviews/queue with filters (F-08)", () => {
  // T-08-08 (AC-08-7)
  it("filters my queue by category, assigned SUBMITTED requests only", async () => {
    const other = await createUser({ role: "REVIEWER", department: "ENGINEERING" });
    const travel = await makeRequest(a, reviewer, { category: "TRAVEL" });
    await makeRequest(a, reviewer, { category: "SUPPLIES" });
    await makeRequest(a, reviewer, { category: "TRAVEL", status: "APPROVED" });
    await makeRequest(b, other, { category: "TRAVEL" });

    const res = await (await signedIn(reviewer)).get("/api/reviews/queue?category=TRAVEL");

    expect(res.status).toBe(200);
    expect(ids(res)).toEqual([travel.id]);
  });

  // T-08-09 (AC-08-7, D-25)
  it("filters my queue by date, oldest first, and refuses a status filter", async () => {
    const inside = await makeRequest(a, reviewer, { submittedAt: bkk("2026-11-15T10:00:00.000") });
    await makeRequest(b, reviewer, { submittedAt: bkk("2026-11-25T10:00:00.000") });
    const agent = await signedIn(reviewer);

    const dated = await agent.get("/api/reviews/queue?from=2026-11-10&to=2026-11-20");
    const status = await agent.get("/api/reviews/queue?status=APPROVED");

    expect(dated.status).toBe(200);
    expect(ids(dated)).toEqual([inside.id]);
    expect(status.status).toBe(400);
    expect(status.body.details).toEqual([
      { field: "status", message: "The review queue cannot be filtered by status" },
    ]);
  });

  // T-08-10 (AC-08-9) — guard: passes before and after the change.
  it("keeps 401 and 403 with filters", async () => {
    const anonymous = request(app);
    expect((await anonymous.get("/api/requests/mine?status=APPROVED")).status).toBe(401);
    expect((await anonymous.get("/api/reviews/queue?category=TRAVEL")).status).toBe(401);
    expect((await (await signedIn(a)).get("/api/reviews/queue?category=TRAVEL")).status).toBe(403);
  });
});
