// F-04 decision body checks (BR-03, D-14): reject needs a reason of 10–1000
// characters; approve takes an optional comment of up to 1000. Both trimmed.
import type { DecisionAction } from "./transitions";

export const MIN_REJECT_REASON = 10;
export const MAX_REASON = 1000;

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
