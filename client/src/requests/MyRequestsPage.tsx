// F-03: "My requests" list (contract UI section, AC-03-1, AC-03-2, AC-03-7).
// F-08: filter bar; the filters come from the page URL (AC-08-10).
import { Link } from "react-router";
import FilterBar from "./FilterBar";
import FilteredListStatus from "./FilteredListStatus";
import { categoryLabel, formatAmount, formatDateTime } from "./format";
import type { RequestListItem } from "./types";
import { useFilteredList } from "./useFilteredList";

export default function MyRequestsPage() {
  const { filters, filtered, state, barKey, apply, clear } = useFilteredList<RequestListItem>("/api/requests/mine", true);

  return (
    <section>
      <h1>My requests</h1>
      <FilterBar key={barKey} initial={filters} withStatus onApply={apply} onClear={clear} />
      <FilteredListStatus state={state} filtered={filtered} clearTo="/requests" />
      {state.kind === "loaded" && state.requests.length === 0 && !filtered && (
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
