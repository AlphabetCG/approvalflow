// F-04 state machine. STUB: real implementation follows the failing tests.
import type { HistoryAction, RequestStatus } from "@prisma/client";

export type DecisionAction = Extract<HistoryAction, "APPROVE" | "REJECT">;

export function nextStatus(_from: RequestStatus, _action: DecisionAction): RequestStatus | null {
  return null;
}
