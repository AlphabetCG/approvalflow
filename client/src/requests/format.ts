// Display helpers shared by the request pages (F-02, F-03).
import { CATEGORIES } from "./validation";

const amountFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

// The API sends amounts as exact strings ("1500.00"); at most 100,000.00, so a Number is exact enough to show.
export const formatAmount = (amount: string) => amountFormat.format(Number(amount));

export const formatDateTime = (iso: string) => dateFormat.format(new Date(iso));

export const categoryLabel = (value: string) => CATEGORIES.find((c) => c.value === value)?.label ?? value;

const ACTION_LABELS: Record<string, string> = { SUBMIT: "Submitted", APPROVE: "Approved", REJECT: "Rejected" };
export const actionLabel = (action: string) => ACTION_LABELS[action] ?? action;
