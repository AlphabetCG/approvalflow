// F-08: filters on My requests and the Review queue (D-24..D-28).
// Parses the query string; the access rule is never part of it (AC-08-6).
import { RequestCategory, RequestStatus } from "@prisma/client";
import type { ErrorDetail } from "../http";

export interface RequestFilters {
  status?: RequestStatus;
  category?: RequestCategory;
  // submittedAt >= submittedFrom and submittedAt < submittedBefore (D-26).
  submittedFrom?: Date;
  submittedBefore?: Date;
}

export type FilterResult = { ok: true; value: RequestFilters } | { ok: false; errors: ErrorDetail[] };

// D-25: read from the Prisma enums, so DRAFT / RETURNED are accepted once they exist.
const STATUSES = Object.values(RequestStatus) as string[];
const CATEGORIES = Object.values(RequestCategory) as string[];

const DAY_MS = 24 * 60 * 60 * 1000;
const LABELS = { status: "Status", category: "Category", from: "From", to: "To" } as const;
type Field = keyof typeof LABELS;

// D-26: a Bangkok calendar day (UTC+7, no daylight saving) → the instant it starts.
// Returns null for anything but a real YYYY-MM-DD date (2026-02-30 is not one).
export function bangkokDayStart(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const utc = new Date(Date.UTC(y, mo - 1, d));
  if (utc.getUTCFullYear() !== y || utc.getUTCMonth() !== mo - 1 || utc.getUTCDate() !== d) return null;
  return new Date(`${value}T00:00:00.000+07:00`);
}

export function parseRequestFilters(
  query: Record<string, unknown>,
  { allowStatus }: { allowStatus: boolean },
): FilterResult {
  const errors: ErrorDetail[] = [];
  const add = (field: Field, message: string) => errors.push({ field, message });

  // D-28: an empty value is no filter; a repeated parameter (an array) is a 400.
  const read = (field: Field): string | undefined => {
    const raw = query[field];
    if (raw === undefined || raw === "") return undefined;
    if (typeof raw !== "string") {
      add(field, `${LABELS[field]} can be given only once`);
      return undefined;
    }
    return raw;
  };

  const value: RequestFilters = {};

  const status = read("status");
  if (status !== undefined) {
    if (!allowStatus) add("status", "The review queue cannot be filtered by status");
    else if (!STATUSES.includes(status)) add("status", `Status must be one of: ${STATUSES.join(", ")}`);
    else value.status = status as RequestStatus;
  }

  const category = read("category");
  if (category !== undefined) {
    if (!CATEGORIES.includes(category)) add("category", `Category must be one of: ${CATEGORIES.join(", ")}`);
    else value.category = category as RequestCategory;
  }

  const day = (field: "from" | "to"): Date | null | undefined => {
    const raw = read(field);
    if (raw === undefined) return undefined;
    const start = bangkokDayStart(raw);
    if (!start) add(field, `${LABELS[field]} must be a date (YYYY-MM-DD)`);
    return start;
  };
  const from = day("from");
  const to = day("to");
  if (from) value.submittedFrom = from;
  if (to) value.submittedBefore = new Date(to.getTime() + DAY_MS); // "to" is inclusive
  // Only between two valid dates, so one mistake gives one error (F-08 v1.1).
  if (from && to && from > to) add("to", "To must not be before From");

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value };
}

// The Prisma where clause for the filters, ANDed with the access rule by the caller.
// D-27: gte / lt never match a NULL submittedAt (an F-05 draft).
export function filterWhere(f: RequestFilters = {}) {
  return {
    ...(f.status && { status: f.status }),
    ...(f.category && { category: f.category }),
    ...((f.submittedFrom || f.submittedBefore) && {
      submittedAt: {
        ...(f.submittedFrom && { gte: f.submittedFrom }),
        ...(f.submittedBefore && { lt: f.submittedBefore }),
      },
    }),
  };
}
