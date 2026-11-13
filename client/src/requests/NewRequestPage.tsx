// F-02: "New request" form (contract UI section, AC-02-9).
import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { ApiError, api, errorMessage } from "../api";
import {
  CATEGORIES,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  validateNewRequest,
  type Field,
  type NewRequestForm,
} from "./validation";

interface SubmittedRequest {
  id: string;
  title: string;
  status: string;
  amount: string;
  reviewer: { id: string; email: string };
}

const EMPTY: NewRequestForm = { title: "", category: "", amount: "", description: "" };
const FIELDS: readonly string[] = ["title", "category", "amount", "description"];

// Label, control and the message beside it; the message is the control's accessible description.
function FieldRow({ id, label, error, children }: { id: Field; label: string; error?: string; children: ReactNode }) {
  return (
    <>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </>
  );
}

export default function NewRequestPage() {
  const [form, setForm] = useState<NewRequestForm>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<SubmittedRequest | null>(null);

  const set = (field: Field) => (e: { target: { value: string } }) => setForm({ ...form, [field]: e.target.value });

  const describe = (field: Field) => ({
    id: field,
    "aria-invalid": fieldErrors[field] ? true : undefined,
    "aria-describedby": fieldErrors[field] ? `${field}-error` : undefined,
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setCreated(null);

    const result = validateNewRequest(form);
    if (!result.ok) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      setCreated(await api<SubmittedRequest>("/api/requests", { method: "POST", body: result.value }));
      setForm(EMPTY);
    } catch (err) {
      // Keep what the user typed; show per-field messages when the API sends them.
      const details = err instanceof ApiError ? (err.details ?? []).filter((d) => FIELDS.includes(d.field)) : [];
      if (details.length > 0) {
        setFieldErrors(Object.fromEntries(details.map((d) => [d.field, d.message])));
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="form-page">
      <h1>New request</h1>
      {created && (
        <p role="status" className="success">
          Request submitted. Status: {created.status}. Reviewer: {created.reviewer.email}.{" "}
          <Link to={`/requests/${created.id}`}>View request</Link>
        </p>
      )}
      <form onSubmit={onSubmit} noValidate>
        {/* Locked while submitting: the reset after success would otherwise wipe edits made meanwhile. */}
        <fieldset className="form-fields" disabled={submitting}>
          <FieldRow id="title" label="Title" error={fieldErrors.title}>
            <input
              {...describe("title")}
              value={form.title}
              onChange={set("title")}
              maxLength={MAX_TITLE_LENGTH}
              required
            />
          </FieldRow>
          <FieldRow id="category" label="Category" error={fieldErrors.category}>
            <select {...describe("category")} value={form.category} onChange={set("category")} required>
              <option value="">Choose…</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow id="amount" label="Amount (THB)" error={fieldErrors.amount}>
            <input
              {...describe("amount")}
              type="number"
              inputMode="decimal"
              min="0.01"
              max="100000"
              step="0.01"
              value={form.amount}
              onChange={set("amount")}
              required
            />
          </FieldRow>
          <FieldRow id="description" label="Description" error={fieldErrors.description}>
            <textarea
              {...describe("description")}
              rows={4}
              value={form.description}
              onChange={set("description")}
              maxLength={MAX_DESCRIPTION_LENGTH}
              required
            />
          </FieldRow>
        </fieldset>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>
          Submit request
        </button>
      </form>
    </section>
  );
}
