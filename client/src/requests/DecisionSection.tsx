// F-04b: Approve / Reject on the detail page (contract F-04 v2 UI section, AC-04-11, AC-04-12).
// Shown only to the assigned reviewer of a SUBMITTED request; the API enforces the same rules.
import { useState } from "react";
import { ApiError, api, errorMessage } from "../api";
import type { Decision } from "./types";

// Same limits and messages as server/src/requests/decision-validation.ts (BR-03, D-14).
export const MIN_REJECT_REASON = 10;
export const MAX_REASON = 1000;

type Action = "approve" | "reject";

function check(action: Action, reason: string): string | null {
  if (reason.length > MAX_REASON) return `Reason must be at most ${MAX_REASON} characters`;
  if (action === "reject" && reason.length < MIN_REJECT_REASON) {
    return `A rejection needs a reason of at least ${MIN_REJECT_REASON} characters`;
  }
  return null;
}

export default function DecisionSection({
  requestId,
  onDecided,
  onStale,
}: {
  requestId: string;
  onDecided: (decision: Decision) => void;
  // The API refused (403, 404, 409): the page shows the message and reloads the
  // request, because its status changed (this section may then disappear).
  onStale: (message: string) => void;
}) {
  const [text, setText] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  // Errors that leave the request unchanged (network, 5xx); shown here, the user can retry.
  const [error, setError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState(false);

  async function decide(action: Action) {
    if (deciding) return;
    setError(null);
    const reason = text.trim();
    const problem = check(action, reason);
    setFieldError(problem);
    if (problem) return;

    setDeciding(true);
    try {
      const body = reason === "" ? {} : { reason };
      onDecided(await api<Decision>(`/api/requests/${encodeURIComponent(requestId)}/${action}`, { method: "POST", body }));
    } catch (err) {
      const detail = err instanceof ApiError ? err.details?.find((d) => d.field === "reason") : undefined;
      if (detail) {
        setFieldError(detail.message);
      } else if (err instanceof ApiError && [403, 404, 409].includes(err.status)) {
        onStale(err.message);
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setDeciding(false);
    }
  }

  return (
    <section aria-labelledby="decision-heading" className="decision">
      <h2 id="decision-heading">Decision</h2>
      <fieldset className="form-fields" disabled={deciding}>
        <label htmlFor="decision-reason">Comment or reason</label>
        <textarea
          id="decision-reason"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? "decision-reason-error" : "decision-reason-hint"}
        />
        {fieldError ? (
          <p id="decision-reason-error" className="field-error">
            {fieldError}
          </p>
        ) : (
          <p id="decision-reason-hint" className="hint">
            Optional when approving. Required when rejecting ({MIN_REJECT_REASON}–{MAX_REASON} characters).
          </p>
        )}
        <div className="actions">
          <button type="button" onClick={() => void decide("approve")}>
            Approve
          </button>
          <button type="button" className="danger" onClick={() => void decide("reject")}>
            Reject
          </button>
        </div>
      </fieldset>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
