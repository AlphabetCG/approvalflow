// F-08: the lines above a filtered list: Loading…, errors, "Results: N" and the
// empty filtered result (contract F-08 v1.1 UI section). The page shows its own
// unfiltered empty text (F-03, F-04) and the table.
import { Link } from "react-router";
import type { ListState } from "./useFilteredList";

export default function FilteredListStatus<T>({
  state,
  filtered,
  clearTo,
}: {
  state: ListState<T>;
  filtered: boolean;
  clearTo: string;
}) {
  if (state.kind === "loading") return <p role="status">Loading…</p>;
  if (state.kind === "error") {
    return (
      <div role="alert">
        {state.messages.map((m) => (
          <p key={m}>{m}</p>
        ))}
      </div>
    );
  }
  if (!filtered) return null;
  if (state.requests.length === 0) {
    return (
      <p>
        <span>No requests match these filters.</span> <Link to={clearTo}>Clear filters</Link>
      </p>
    );
  }
  return <p>Results: {state.requests.length}</p>;
}
