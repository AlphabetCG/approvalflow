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
    throw new ApiError(
      res.status,
      body.error ?? "HTTP_ERROR",
      body.message ?? `${res.status} ${res.statusText}`,
      Array.isArray(body.details) ? body.details : undefined,
    );
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export async function getJson<T>(path: string): Promise<T> {
  return api<T>(path);
}
