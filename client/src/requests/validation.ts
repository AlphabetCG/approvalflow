// F-02 form checks. Same rules and messages as server/src/requests/validation.ts,
// so the user sees the problem before the API is called; the API still enforces them.

export const CATEGORIES = [
  { value: "TRAVEL", label: "Travel" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "TRAINING", label: "Training" },
  { value: "OTHER", label: "Other" },
] as const;

export const MAX_AMOUNT = 100_000;
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;

export type Field = "title" | "category" | "amount" | "description";

export interface NewRequestForm {
  title: string;
  category: string;
  amount: string;
  description: string;
}

export interface NewRequestBody {
  title: string;
  category: string;
  amount: number;
  description: string;
}

export type FormResult =
  | { ok: true; value: NewRequestBody }
  | { ok: false; errors: Partial<Record<Field, string>> };

function textError(label: string, value: string, maxLength: number): string | undefined {
  if (value.trim() === "") return `${label} is required`;
  if (value.trim().length > maxLength) return `${label} must be at most ${maxLength} characters`;
  return undefined;
}

function amountError(raw: string): string | undefined {
  const value = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(value)) return "Amount must be a number";
  if (value <= 0) return "Amount must be greater than 0";
  if (value > MAX_AMOUNT) return `Amount must be at most ${MAX_AMOUNT}`;
  if (!/^\d+(\.\d{1,2})?$/.test(String(value))) return "Amount must have at most 2 decimal places";
  return undefined;
}

export function validateNewRequest(form: NewRequestForm): FormResult {
  const errors: Partial<Record<Field, string>> = {};
  const title = textError("Title", form.title, MAX_TITLE_LENGTH);
  if (title) errors.title = title;
  if (!CATEGORIES.some((c) => c.value === form.category)) errors.category = "Choose a category";
  const amount = amountError(form.amount);
  if (amount) errors.amount = amount;
  const description = textError("Description", form.description, MAX_DESCRIPTION_LENGTH);
  if (description) errors.description = description;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title: form.title.trim(),
      category: form.category,
      amount: Number(form.amount),
      description: form.description.trim(),
    },
  };
}
