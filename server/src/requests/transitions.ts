// F-04 state machine (BR-02). Sprint 1 has two transitions; F-06 adds RETURNED.
import type { HistoryAction, RequestStatus } from "@prisma/client";

export type DecisionAction = Extract<HistoryAction, "APPROVE" | "REJECT">;

const TRANSITIONS: Partial<Record<RequestStatus, Partial<Record<DecisionAction, RequestStatus>>>> = {
  SUBMITTED: { APPROVE: "APPROVED", REJECT: "REJECTED" },
};

// The status after `action`, or null when the transition is not allowed.
export function nextStatus(from: RequestStatus, action: DecisionAction): RequestStatus | null {
  return TRANSITIONS[from]?.[action] ?? null;
}
