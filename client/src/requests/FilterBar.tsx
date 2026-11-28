// F-08: filter bar shared by My requests and the Review queue (contract F-08 v1.1 UI section, AC-08-10).
// The filters live in the page URL, so reload, back and a shared link keep them.
import { useState, type FormEvent } from "react";
import { REQUEST_STATUSES } from "./types";
import { CATEGORIES } from "./validation";

export interface Filters {
  status?: string;
  category?: string;
  from?: string;
  to?: string;
}

// Fixed order, so the same filters always give the same URL and API query.
const KEYS = ["status", "category", "from", "to"] as const;

export function readFilters(params: URLSearchParams, withStatus: boolean): Filters {
  const filters: Filters = {};
  for (const key of KEYS) {
    const value = params.get(key);
    if (value && (withStatus || key !== "status")) filters[key] = value;
  }
  return filters;
}

// "?status=APPROVED&from=2026-11-01", or "" without filters (D-28: empty values are dropped).
export function toQuery(filters: Filters): string {
  const params = new URLSearchParams();
  for (const key of KEYS) if (filters[key]) params.set(key, filters[key]!);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export default function FilterBar({
  initial,
  withStatus,
  onApply,
  onClear,
}: {
  initial: Filters;
  withStatus: boolean;
  onApply: (filters: Filters) => void;
  onClear: () => void;
}) {
  const [values, setValues] = useState<Filters>(initial);
  const [toError, setToError] = useState<string | null>(null);
  const set = (key: keyof Filters) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function apply(e: FormEvent) {
    e.preventDefault();
    // YYYY-MM-DD strings compare like dates.
    if (values.from && values.to && values.from > values.to) {
      setToError("To must not be before From");
      return;
    }
    setToError(null);
    onApply(values);
  }

  return (
    <form className="filter-bar" onSubmit={apply} aria-label="Filters">
      {withStatus && (
        <label>
          Status
          <select value={values.status ?? ""} onChange={set("status")}>
            <option value="">All</option>
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Category
        <select value={values.category ?? ""} onChange={set("category")}>
          <option value="">All</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        From
        <input type="date" value={values.from ?? ""} onChange={set("from")} />
      </label>
      {/* The message is outside the label, so it is the input's description, not part of its name. */}
      <div className="filter-field">
        <label>
          To
          <input
            type="date"
            value={values.to ?? ""}
            onChange={set("to")}
            aria-invalid={toError ? true : undefined}
            aria-describedby={toError ? "filter-to-error" : undefined}
          />
        </label>
        {toError && (
          <p id="filter-to-error" className="field-error">
            {toError}
          </p>
        )}
      </div>
      <div className="actions">
        <button type="submit">Apply</button>
        <button type="button" onClick={onClear}>
          Clear
        </button>
      </div>
    </form>
  );
}
