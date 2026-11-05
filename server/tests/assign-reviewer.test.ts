import { describe, expect, it } from "vitest";
import { pickReviewer } from "../src/requests/assign-reviewer";

describe("pickReviewer", () => {
  // T-02-06
  it("assigns reviewers in turn and wraps around", () => {
    const reviewers = ["a", "b", "c"];
    const picks: (string | null)[] = [];
    let last: string | null = null;
    for (let i = 0; i < 4; i++) {
      last = pickReviewer(reviewers, "requester", last);
      picks.push(last);
    }
    expect(picks).toEqual(["a", "b", "c", "a"]);
  });

  it("starts with the first reviewer when nothing was assigned yet", () => {
    expect(pickReviewer(["a", "b"], "requester", null)).toBe("a");
  });

  it("skips the requester and continues with the next reviewer", () => {
    expect(pickReviewer(["a", "b", "c"], "b", "a")).toBe("c");
  });

  it("wraps past the requester when the requester is last in the list", () => {
    expect(pickReviewer(["a", "b", "c"], "c", "b")).toBe("a");
  });

  it("starts from the beginning when the last reviewer has left the list", () => {
    expect(pickReviewer(["a", "b"], "requester", "gone")).toBe("a");
  });

  // T-02-05 (never the requester, for every position and every last value)
  it("never picks the requester", () => {
    const reviewers = ["a", "b", "c", "d"];
    for (const requester of reviewers) {
      for (const last of [null, "gone", ...reviewers]) {
        const pick = pickReviewer(reviewers, requester, last);
        expect(pick).not.toBeNull();
        expect(pick).not.toBe(requester);
      }
    }
  });

  // T-02-07
  it("returns null when there are no reviewers", () => {
    expect(pickReviewer([], "requester", null)).toBeNull();
  });

  it("returns null when the requester is the only reviewer", () => {
    expect(pickReviewer(["a"], "a", "a")).toBeNull();
  });

  it("works with numeric ids", () => {
    expect(pickReviewer([1, 2, 3], 2, 1)).toBe(3);
  });
});
