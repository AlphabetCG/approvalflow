// F-04b: the reviewer's queue (contract F-04 v2 UI section, AC-04-10).
// F-08: filter bar without Status (D-25); the filters come from the page URL.
import { Link } from "react-router";
import FilterBar from "../requests/FilterBar";
import FilteredListStatus from "../requests/FilteredListStatus";
import { categoryLabel, formatAmount, formatDateTime } from "../requests/format";
import type { QueueItem } from "../requests/types";
import { useFilteredList } from "../requests/useFilteredList";

export default function ReviewQueuePage() {
  const { filters, filtered, state, barKey, apply, clear } = useFilteredList<QueueItem>("/api/reviews/queue", false);

  return (
    <section>
      <h1>Review queue</h1>
      <FilterBar key={barKey} initial={filters} withStatus={false} onApply={apply} onClear={clear} />
      <FilteredListStatus state={state} filtered={filtered} clearTo="/reviews" />
      {state.kind === "loaded" && state.requests.length === 0 && !filtered && <p>Nothing to review.</p>}
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
