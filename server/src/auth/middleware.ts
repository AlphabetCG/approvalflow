// F-01 middleware used by every protected route:
//   router.get("/queue", requireRole("REVIEWER"), handler)   // 401 / 403
//   router.post("/", requireAuth, handler)                    // 401
// Inside the handler, req.user is the signed-in user.
import type { RequestHandler } from "express";
import type { Role } from "@prisma/client";
import { forbidden, unauthorized } from "../http";
import { SESSION_COOKIE, findSessionUser } from "./session";

// Mounted once on /api in app.ts. Touches the database only when a cookie is sent.
export const loadSessionUser: RequestHandler = async (req, _res, next) => {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token === "string" && token !== "") {
    req.user = (await findSessionUser(token)) ?? undefined;
  }
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) throw unauthorized();
  next();
};

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) throw unauthorized();
    if (!roles.includes(req.user.role)) throw forbidden(`Requires role ${roles.join(" or ")}`);
    next();
  };
}
