// F-03: "My requests" list (contract UI section, AC-03-1, AC-03-2, AC-03-7).
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, errorMessage } from "../api";
import { categoryLabel, formatAmount, formatDateTime } from "./format";
import type { RequestListItem } from "./types";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; requests: RequestListItem[] };

export default function MyRequestsPage() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    api<{ requests: RequestListItem[] }>("/api/requests/mine")
      .then((body) => active && setState({ kind: "loaded", requests: body.requests }))
      .catch((err: unknown) => active && setState({ kind: "error", message: errorMessage(err) }));
    return () => {
      active = false;
    };
  }, []);

  return (
    <section>
      <h1>My requests</h1>
      {state.kind === "loading" && <p role="status">Loading…</p>}
      {state.kind === "error" && <p role="alert">{state.message}</p>}
      {state.kind === "loaded" && state.requests.length === 0 && (
        <p>
          You have not submitted any requests yet. <Link to="/requests/new">New request</Link>
        </p>
      )}
      {state.kind === "loaded" && state.requests.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Category</th>
                <th scope="col" className="num">
                  Amount (THB)
                </th>
                <th scope="col">Status</th>
                <th scope="col">Submitted</th>
                <th scope="col">Reviewer</th>
              </tr>
            </thead>
            <tbody>
              {state.requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/requests/${r.id}`}>{r.title}</Link>
                  </td>
                  <td>{categoryLabel(r.category)}</td>
                  <td className="num">{formatAmount(r.amount)}</td>
                  <td>
                    <span className={`status status-${r.status.toLowerCase()}`}>{r.status}</span>
                  </td>
                  <td>
                    <time dateTime={r.submittedAt}>{formatDateTime(r.submittedAt)}</time>
                  </td>
                  <td>{r.reviewer.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
