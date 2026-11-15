import type { AuthUser } from "../auth/session";

declare global {
  namespace Express {
    interface Request {
      // Set by loadSessionUser when the session cookie is valid (F-01).
      user?: AuthUser;
    }
  }
}

export {};
