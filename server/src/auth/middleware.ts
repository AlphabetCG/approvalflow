// F-01 middleware. STUB: real implementation follows the failing tests.
import type { RequestHandler } from "express";
import type { Role } from "@prisma/client";

export const loadSessionUser: RequestHandler = (_req, _res, next) => next();

export const requireAuth: RequestHandler = (_req, _res, next) => next();

export function requireRole(..._roles: Role[]): RequestHandler {
  return (_req, _res, next) => next();
}
