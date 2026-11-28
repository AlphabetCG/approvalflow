// T-08-01 (AC-08-3, AC-08-5): parseRequestFilters, F-08 v1.1 (D-25, D-26, D-28).
import { describe, expect, it } from "vitest";
import { parseRequestFilters } from "../src/requests/filters";

const mine = (query: Record<string, unknown>) => parseRequestFilters(query, { allowStatus: true });
const errorFields = (r: ReturnType<typeof mine>) => (r.ok ? [] : r.errors.map((e) => e.field));

describe("parseRequestFilters (F-08)", () => {
  it("gives no filters for an empty query or empty values", () => {
    expect(mine({})).toEqual({ ok: true, value: {} });
    expect(mine({ status: "", category: "", from: "", to: "" })).toEqual({ ok: true, value: {} });
  });

  it("turns inclusive Bangkok days into a half-open UTC range", () => {
    expect(mine({ from: "2026-11-10", to: "2026-11-20" })).toEqual({
      ok: true,
      value: {
        submittedFrom: new Date("2026-11-09T17:00:00.000Z"),
        submittedBefore: new Date("2026-11-20T17:00:00.000Z"),
      },
    });
  });

  it("accepts the same day as From and To, and a leap day", () => {
    expect(mine({ from: "2026-11-20", to: "2026-11-20" }).ok).toBe(true);
    expect(mine({ from: "2028-02-29" }).ok).toBe(true);
  });

  it("keeps a valid status and category", () => {
    expect(mine({ status: "APPROVED", category: "TRAVEL" })).toEqual({
      ok: true,
      value: { status: "APPROVED", category: "TRAVEL" },
    });
  });

  it.each([
    [{ from: "2026-02-30" }, ["from"]],
    [{ from: "10/11/2026" }, ["from"]],
    [{ to: "2026-1-5" }, ["to"]],
    [{ status: ["APPROVED", "REJECTED"] }, ["status"]],
    [{ from: "2026-11-21", to: "2026-11-20" }, ["to"]],
    [{ from: "2026-02-30", to: "2026-01-01" }, ["from"]],
    [{ status: "approved" }, ["status"]],
    [{ category: "Travel", from: "x", to: ["a", "b"] }, ["category", "from", "to"]],
  ])("rejects %j on %j", (query, fields) => {
    expect(errorFields(mine(query))).toEqual(fields);
  });

  it("refuses a status on the review queue", () => {
    expect(parseRequestFilters({ status: "SUBMITTED" }, { allowStatus: false })).toEqual({
      ok: false,
      errors: [{ field: "status", message: "The review queue cannot be filtered by status" }],
    });
  });

  it("ignores unknown parameters such as requesterId (D-28)", () => {
    expect(mine({ requesterId: "someone", reviewerId: "else" })).toEqual({ ok: true, value: {} });
  });
});
