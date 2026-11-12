import { describe, expect, it } from "vitest";
import { validateDecision } from "../src/requests/decision-validation";
import { nextStatus } from "../src/requests/transitions";

describe("nextStatus (F-04 state machine)", () => {
  // T-04-01 (AC-04-8, BR-02)
  it.each([
    ["SUBMITTED", "APPROVE", "APPROVED"],
    ["SUBMITTED", "REJECT", "REJECTED"],
    ["APPROVED", "APPROVE", null],
    ["APPROVED", "REJECT", null],
    ["REJECTED", "APPROVE", null],
    ["REJECTED", "REJECT", null],
  ] as const)("%s + %s -> %s", (from, action, to) => {
    expect(nextStatus(from, action)).toBe(to);
  });
});

const errorsFor = (action: "APPROVE" | "REJECT", body: unknown) => {
  const result = validateDecision(action, body);
  return result.ok ? [] : result.errors.map((e) => e.field);
};

describe("validateDecision: reject (BR-03, D-14)", () => {
  // T-04-02 (AC-04-4)
  it.each([
    ["no body", undefined],
    ["an empty object", {}],
    ["a blank reason", { reason: "     " }],
    ["9 characters", { reason: "123456789" }],
    ["9 characters plus spaces", { reason: "   123456789   " }],
    ["1001 characters", { reason: "x".repeat(1001) }],
    ["a number", { reason: 1234567890 }],
  ])("rejects %s", (_name, body) => {
    expect(errorsFor("REJECT", body)).toEqual(["reason"]);
  });

  it.each([
    ["10 characters", "1234567890"],
    ["1000 characters", "x".repeat(1000)],
  ])("accepts %s", (_name, reason) => {
    expect(validateDecision("REJECT", { reason })).toEqual({ ok: true, reason });
  });

  it("trims the reason", () => {
    expect(validateDecision("REJECT", { reason: "  Missing receipt  " })).toEqual({
      ok: true,
      reason: "Missing receipt",
    });
  });
});

describe("validateDecision: approve (D-14)", () => {
  // T-04-03 (AC-04-4)
  it.each([
    ["no body", undefined],
    ["an empty object", {}],
    ["a blank comment", { reason: "   " }],
  ])("accepts %s with no comment", (_name, body) => {
    expect(validateDecision("APPROVE", body)).toEqual({ ok: true, reason: null });
  });

  it("keeps a short comment, trimmed", () => {
    expect(validateDecision("APPROVE", { reason: "  OK  " })).toEqual({ ok: true, reason: "OK" });
  });

  it.each([
    ["1001 characters", { reason: "x".repeat(1001) }],
    ["a number", { reason: 5 }],
  ])("rejects a comment of %s", (_name, body) => {
    expect(errorsFor("APPROVE", body)).toEqual(["reason"]);
  });
});
