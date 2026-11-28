// F-08: loads a list endpoint with the filters from the page URL (contract F-08 v1.1).
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { ApiError, api, errorMessage } from "../api";
import { readFilters, toQuery, type Filters } from "./FilterBar";

export type ListState<T> =
  | { kind: "loading" }
  // A 400 lists one message per bad parameter (D-28); other errors have one message.
  | { kind: "error"; messages: string[] }
  | { kind: "loaded"; requests: T[] };

export function useFilteredList<T>(path: string, withStatus: boolean) {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params, withStatus);
  const query = toQuery(filters);
  const [loaded, setLoaded] = useState<{ query: string; state: ListState<T> } | null>(null);
  // Clear also resets controls that were changed but not applied.
  const [resets, setResets] = useState(0);

  useEffect(() => {
    let active = true;
    api<{ requests: T[] }>(`${path}${query}`)
      .then((body) => active && setLoaded({ query, state: { kind: "loaded", requests: body.requests } }))
      .catch((err: unknown) => {
        if (!active) return;
        const messages =
          err instanceof ApiError && err.details?.length ? err.details.map((d) => d.message) : [errorMessage(err)];
        setLoaded({ query, state: { kind: "error", messages } });
      });
    return () => {
      active = false;
    };
  }, [path, query]);

  return {
    filters,
    filtered: query !== "",
    // Shows "Loading…" again while a new query is on its way.
    state: loaded && loaded.query === query ? loaded.state : ({ kind: "loading" } as ListState<T>),
    // Remounts the filter bar with the URL's values after Apply or Clear.
    barKey: `${query}#${resets}`,
    apply: (next: Filters) => setParams(new URLSearchParams(toQuery(next))),
    clear: () => {
      setResets((n) => n + 1);
      setParams(new URLSearchParams());
    },
  };
}
