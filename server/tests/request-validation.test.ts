import { describe, expect, it } from "vitest";
import { validateSubmitRequest } from "../src/requests/validation";

const valid = {
  title: "Conference travel",
  category: "TRAVEL",
  amount: 1500,
  description: "Train tickets to the conference",
};

const fieldsWithErrors = (body: unknown): string[] => {
  const result = validateSubmitRequest(body);
  return result.ok ? [] : result.errors.map((e) => e.field);
};

describe("validateSubmitRequest", () => {
  it("accepts a valid body", () => {
    expect(validateSubmitRequest(valid)).toEqual({ ok: true, value: valid });
  });

  // T-02-01 (BR-04)
  it.each([
    ["zero", 0],
    ["negative", -1],
    ["just over the limit", 100000.01],
    ["a numeric string", "500"],
    ["null", null],
    ["NaN", Number.NaN],
    ["infinity", Number.POSITIVE_INFINITY],
    ["three decimal places", 1.234],
    ["too small to have 2 decimals", 0.001],
  ])("rejects an amount that is %s", (_name, amount) => {
    expect(fieldsWithErrors({ ...valid, amount })).toEqual(["amount"]);
  });

  it("rejects a missing amount", () => {
    const { amount: _amount, ...body } = valid;
    expect(fieldsWithErrors(body)).toEqual(["amount"]);
  });

  // T-02-02 (BR-04 boundaries)
  it.each([0.01, 1500.5, 100000])("accepts the amount %s", (amount) => {
    expect(fieldsWithErrors({ ...valid, amount })).toEqual([]);
  });

  // T-02-03
  it.each([
    ["title", undefined],
    ["title", ""],
    ["title", "   "],
    ["title", 42],
    ["title", "x".repeat(201)],
    ["description", undefined],
    ["description", "   "],
    ["description", "x".repeat(2001)],
    ["category", undefined],
    ["category", "FOOD"],
    ["category", "travel"],
  ])("rejects %s = %j", (field, value) => {
    expect(fieldsWithErrors({ ...valid, [field]: value })).toEqual([field]);
  });

  it("accepts a title and description at their maximum length", () => {
    const body = { ...valid, title: "x".repeat(200), description: "x".repeat(2000) };
    expect(fieldsWithErrors(body)).toEqual([]);
  });

  it.each([[undefined], [null], ["text"], [[]]])("reports every field when the body is %j", (body) => {
    expect(fieldsWithErrors(body).sort()).toEqual(["amount", "category", "description", "title"]);
  });

  it("reports every invalid field at once", () => {
    expect(fieldsWithErrors({ ...valid, title: "", amount: 0 }).sort()).toEqual(["amount", "title"]);
  });

  // T-02-04
  it("trims text and keeps only the four input fields", () => {
    const result = validateSubmitRequest({
      ...valid,
      title: "  Conference travel  ",
      description: "  Train tickets to the conference  ",
      status: "APPROVED",
      reviewerId: "someone",
      requesterId: "someone-else",
      submittedAt: "2000-01-01",
    });
    expect(result).toEqual({ ok: true, value: valid });
  });
});
