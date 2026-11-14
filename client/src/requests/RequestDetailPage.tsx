// F-03: one request with its history (contract UI section, AC-03-3 to AC-03-5, AC-03-7).
// F-04b: the assigned reviewer of a SUBMITTED request gets the Decision section (F-04 v2, AC-04-11, AC-04-12).
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ApiError, api, errorMessage } from "../api";
import DecisionSection from "./DecisionSection";
import { actionLabel, categoryLabel, formatAmount, formatDateTime } from "./format";
import type { Decision, RequestDetail, UserRef } from "./types";

type State =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; request: RequestDetail };

// Result of the last decision attempt, shown above the details.
type Notice = { kind: "success"; text: string } | { kind: "refused"; text: string } | null;

const person = (u: UserRef) => `${u.name} (${u.email})`;

// An approve comment and a reject reason are both stored in `reason` (D-14).
const reasonLabel = (action: string) => (action === "APPROVE" ? "Comment" : "Reason");

// currentUserId: the signed-in user, to decide whether the Decision section shows (F-04b).
export default function RequestDetailPage({ currentUserId }: { currentUserId: string }) {
  const { id = "" } = useParams();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [notice, setNotice] = useState<Notice>(null);
  // Bumped to load the request again after the API refused a decision.
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    setNotice(null);
  }, [id]);

  useEffect(() => {
    let active = true;
    // A reload keeps the current page on screen until the fresh copy arrives.
    setState((s) => (s.kind === "loaded" && s.request.id === id ? s : { kind: "loading" }));
    api<RequestDetail>(`/api/requests/${encodeURIComponent(id)}`)
      .then((request) => active && setState({ kind: "loaded", request }))
      .catch((err: unknown) => {
        if (!active) return;
        // D-10: "not yours" and "does not exist" look the same.
        if (err instanceof ApiError && err.status === 404) setState({ kind: "not-found" });
        else setState({ kind: "error", message: errorMessage(err) });
      });
    return () => {
      active = false;
    };
  }, [id, reloads]);

  const back = <Link to="/requests">My requests</Link>;

  if (state.kind === "loading") return <p role="status">Loading…</p>;
  if (state.kind === "not-found") {
    return (
      <section>
        {notice?.kind === "refused" && <p role="alert">{notice.text}</p>}
        <p>Request not found.</p>
        <p>{back}</p>
      </section>
    );
  }
  if (state.kind === "error") {
    return (
      <section>
        <p role="alert">{state.message}</p>
        <p>{back}</p>
      </section>
    );
  }

  const r = state.request;
  const canDecide = r.status === "SUBMITTED" && r.reviewer.id === currentUserId;

  function applyDecision(d: Decision) {
    setState({ kind: "loaded", request: { ...r, status: d.status, history: [...r.history, d.decision] } });
    setNotice({ kind: "success", text: d.status === "APPROVED" ? "Request approved." : "Request rejected." });
  }

  function refused(message: string) {
    setNotice({ kind: "refused", text: message });
    setReloads((n) => n + 1);
  }

  return (
    <article className="request-detail">
      <p className="breadcrumb">← {back}</p>
      <h1>{r.title}</h1>
      {notice?.kind === "success" && (
        <p role="status" className="success">
          {notice.text}
        </p>
      )}
      {notice?.kind === "refused" && <p role="alert">{notice.text}</p>}
      <section aria-label="Request details">
        <dl>
          <dt>Status</dt>
          <dd>
            <span className={`status status-${r.status.toLowerCase()}`}>{r.status}</span>
          </dd>
          <dt>Category</dt>
          <dd>{categoryLabel(r.category)}</dd>
          <dt>Amount (THB)</dt>
          <dd>{formatAmount(r.amount)}</dd>
          <dt>Requester</dt>
          <dd>{person(r.requester)}</dd>
          <dt>Reviewer</dt>
          <dd>{person(r.reviewer)}</dd>
          <dt>Submitted</dt>
          <dd>
            <time dateTime={r.submittedAt}>{formatDateTime(r.submittedAt)}</time>
          </dd>
          <dt>Description</dt>
          <dd className="description">{r.description}</dd>
        </dl>
      </section>
      {canDecide && <DecisionSection requestId={r.id} onDecided={applyDecision} onStale={refused} />}
      <section aria-labelledby="history-heading">
        <h2 id="history-heading">History</h2>
        <ol className="history">
          {r.history.map((h) => (
            <li key={h.id}>
              <strong>{actionLabel(h.action)}</strong> by {person(h.actor)} ·{" "}
              <span>
                {h.fromStatus ?? "–"} → {h.toStatus}
              </span>{" "}
              · <time dateTime={h.createdAt}>{formatDateTime(h.createdAt)}</time>
              {h.reason && (
                <p className="reason">
                  {reasonLabel(h.action)}: {h.reason}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
