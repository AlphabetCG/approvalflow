// F-04b: Approve / Reject on the detail page. Stub until the implementation commit.
import type { Decision } from "./types";

export default function DecisionSection(_props: {
  requestId: string;
  onDecided: (decision: Decision) => void;
  // The API refused (403, 404, 409): the request changed, so the page reloads it.
  onStale: () => void;
}) {
  return null;
}
