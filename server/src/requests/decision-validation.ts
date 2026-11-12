// F-04 decision body checks. STUB: real implementation follows the failing tests.
import type { DecisionAction } from "./transitions";

export const MIN_REJECT_REASON = 10;
export const MAX_REASON = 1000;

export type DecisionValidation =
  | { ok: true; reason: string | null }
  | { ok: false; errors: { field: "reason"; message: string }[] };

export function validateDecision(_action: DecisionAction, _body: unknown): DecisionValidation {
  return { ok: true, reason: null };
}
