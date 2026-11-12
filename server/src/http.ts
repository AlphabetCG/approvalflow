// Throw an HttpError from any route; the error handler in app.ts turns it into
// { "error": code, "message": message } with the given status, plus "details"
// when they are set (per-field validation messages, F-02).
export interface ErrorDetail {
  field: string;
  message: string;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
    public readonly details?: ErrorDetail[],
  ) {
    super(message ?? code);
  }
}

export const badRequest = (message: string, details?: ErrorDetail[]) =>
  new HttpError(400, "VALIDATION_ERROR", message, details);
export const unauthorized = () => new HttpError(401, "UNAUTHENTICATED", "Sign in required");
export const forbidden = (message = "Not allowed") => new HttpError(403, "FORBIDDEN", message);
export const notFound = (message = "Not found") => new HttpError(404, "NOT_FOUND", message);
export const conflict = (message: string) => new HttpError(409, "CONFLICT", message);
