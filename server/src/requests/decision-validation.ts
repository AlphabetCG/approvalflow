// F-04 decision body checks (BR-03, D-14): reject needs a reason of 10–1000
// characters; approve takes an optional comment of up to 1000. Both trimmed.
// CR-01 (BR-08, D-17): approving more than 20,000 THB needs a comment too. That
// rule needs the stored amount, so decide() applies it after the access checks.
import type { Prisma } from "@prisma/client";
import type { DecisionAction } from "./transitions";

export const MIN_REJECT_REASON = 10;
export const MAX_REASON = 1000;

// CR-01: approvals of more than this amount (THB) need a comment of MIN_REJECT_REASON+ characters.
export const HIGH_VALUE_LIMIT = 20000;
export const HIGH_VALUE_MESSAGE = `Approving a request over 20,000 THB needs a comment of at least ${MIN_REJECT_REASON} characters`;

// Decimal comparison, so 20000.00 is not over the limit and 20000.01 is (no floats).
export function requiresApproveComment(amount: Prisma.Decimal): boolean {
  return amount.greaterThan(HIGH_VALUE_LIMIT);
}

export type DecisionValidation =
  | { ok: true; reason: string | null }
  | { ok: false; errors: { field: "reason"; message: string }[] };

const fail = (message: string): DecisionValidation => ({ ok: false, errors: [{ field: "reason", message }] });

export function validateDecision(action: DecisionAction, body: unknown): DecisionValidation {
  const raw =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>).reason
      : undefined;

  if (raw !== undefined && raw !== null && typeof raw !== "string") return fail("Reason must be text");
  const reason = typeof raw === "string" ? raw.trim() : "";

  if (reason.length > MAX_REASON) return fail(`Reason must be at most ${MAX_REASON} characters`);
  if (action === "REJECT" && reason.length < MIN_REJECT_REASON) {
    return fail(`A rejection needs a reason of at least ${MIN_REJECT_REASON} characters`);
  }
  return { ok: true, reason: reason === "" ? null : reason };
}
