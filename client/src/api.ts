const BASE = import.meta.env.VITE_API_URL ?? "";

// One entry per invalid field in a 400 (F-02 contract).
export interface FieldErrorDetail {
  field: string;
  message: string;
}

// Error body from the API: { error, message, details? } (server/src/http.ts).
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: FieldErrorDetail[],
  ) {
    super(message);
  }
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) onUnauthorized?.();
    throw new ApiError(
      res.status,
      body.error ?? "HTTP_ERROR",
      body.message ?? `${res.status} ${res.statusText}`,
      Array.isArray(body.details) ? body.details : undefined,
    );
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

// Called on every 401, before the ApiError is thrown. AuthProvider registers it
// so an expired session sends the user to the login page from any page (F-01 v2);
// pages do not handle 401 themselves.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

// The message to show for a failed call: the API's own, or a generic one when
// the server could not be reached.
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Cannot reach the server. Try again.";
}
