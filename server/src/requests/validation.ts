// Validation for POST /api/requests (F-02 contract, BR-04, D-03, D-04).

export const REQUEST_CATEGORIES = ["TRAVEL", "SUPPLIES", "EQUIPMENT", "TRAINING", "OTHER"] as const;
export type RequestCategory = (typeof REQUEST_CATEGORIES)[number];

export const MAX_AMOUNT = 100_000;
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;

export interface SubmitRequestInput {
  title: string;
  category: RequestCategory;
  amount: number;
  description: string;
}

export interface FieldError {
  field: keyof SubmitRequestInput;
  message: string;
}

export type ValidationResult =
  | { ok: true; value: SubmitRequestInput }
  | { ok: false; errors: FieldError[] };

const isCategory = (value: unknown): value is RequestCategory =>
  (REQUEST_CATEGORIES as readonly unknown[]).includes(value);

function textError(label: string, value: unknown, maxLength: number): string | null {
  if (typeof value !== "string" || value.trim() === "") return `${label} is required`;
  if (value.trim().length > maxLength) return `${label} must be at most ${maxLength} characters`;
  return null;
}

function amountError(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Amount must be a number";
  if (value <= 0) return "Amount must be greater than 0";
  if (value > MAX_AMOUNT) return `Amount must be at most ${MAX_AMOUNT}`;
  // String() gives the shortest exact form; very small values use "1e-7", which also fails here.
  if (!/^\d+(\.\d{1,2})?$/.test(String(value))) return "Amount must have at most 2 decimal places";
  return null;
}

// Reads only the four input fields, so status, reviewerId and requesterId in
// the body can never reach the database.
export function validateSubmitRequest(body: unknown): ValidationResult {
  const input: Record<string, unknown> =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  const { title, category, amount, description } = input;

  const errors: FieldError[] = [];
  const add = (field: FieldError["field"], message: string | null) => {
    if (message) errors.push({ field, message });
  };
  add("title", textError("Title", title, MAX_TITLE_LENGTH));
  add("category", isCategory(category) ? null : `Category must be one of ${REQUEST_CATEGORIES.join(", ")}`);
  add("amount", amountError(amount));
  add("description", textError("Description", description, MAX_DESCRIPTION_LENGTH));

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title: (title as string).trim(),
      category: category as RequestCategory,
      amount: amount as number,
      description: (description as string).trim(),
    },
  };
}
