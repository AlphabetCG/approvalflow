// F-03: one request with its history (contract UI section, AC-03-3 to AC-03-5, AC-03-7).
// F-04b adds the reviewer's Approve and Reject buttons to this page.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ApiError, api, errorMessage } from "../api";
import { actionLabel, categoryLabel, formatAmount, formatDateTime } from "./format";
import type { RequestDetail, UserRef } from "./types";

type State =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; request: RequestDetail };

const person = (u: UserRef) => `${u.name} (${u.email})`;

// currentUserId: the signed-in user, to decide whether the Decision section shows (F-04b).
export default function RequestDetailPage(_props: { currentUserId: string }) {
  const { id = "" } = useParams();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    setState({ kind: "loading" });
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
  }, [id]);

  const back = <Link to="/requests">My requests</Link>;

  if (state.kind === "loading") return <p role="status">Loading…</p>;
  if (state.kind === "not-found") {
    return (
      <section>
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
  return (
    <article className="request-detail">
      <p className="breadcrumb">← {back}</p>
      <h1>{r.title}</h1>
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
              {h.reason && <p className="reason">Reason: {h.reason}</p>}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
