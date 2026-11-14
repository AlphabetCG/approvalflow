// F-04b: the reviewer's queue (contract F-04 v2 UI section, AC-04-10).
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, errorMessage } from "../api";
import { categoryLabel, formatAmount, formatDateTime } from "../requests/format";
import type { QueueItem } from "../requests/types";

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "loaded"; requests: QueueItem[] };

export default function ReviewQueuePage() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    api<{ requests: QueueItem[] }>("/api/reviews/queue")
      .then((body) => active && setState({ kind: "loaded", requests: body.requests }))
      .catch((err: unknown) => active && setState({ kind: "error", message: errorMessage(err) }));
    return () => {
      active = false;
    };
  }, []);

  return (
    <section>
      <h1>Review queue</h1>
      {state.kind === "loading" && <p role="status">Loading…</p>}
      {state.kind === "error" && <p role="alert">{state.message}</p>}
      {state.kind === "loaded" && state.requests.length === 0 && <p>Nothing to review.</p>}
      {state.kind === "loaded" && state.requests.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Requester</th>
                <th scope="col">Category</th>
                <th scope="col" className="num">
                  Amount (THB)
                </th>
                <th scope="col">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {state.requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/requests/${r.id}`}>{r.title}</Link>
                  </td>
                  <td>{r.requester.name}</td>
                  <td>{categoryLabel(r.category)}</td>
                  <td className="num">{formatAmount(r.amount)}</td>
                  <td>
                    <time dateTime={r.submittedAt}>{formatDateTime(r.submittedAt)}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
