// F-01: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import { verifyAgainstDummy, verifyPassword } from "../auth/password";
import {
  AUTH_USER_SELECT,
  SESSION_COOKIE,
  clearSessionCookie,
  createSession,
  deleteSession,
  sessionCookieOptions,
} from "../auth/session";
import type { Config } from "../config";
import { prisma } from "../db";
import { HttpError, badRequest } from "../http";

const invalidCredentials = () => new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");

export function authRouter(config: Config): Router {
  const router = Router();
  const cookieOptions = sessionCookieOptions(config.nodeEnv, config.sessionTtlHours);

  router.post("/login", async (req, res) => {
    const { email, password } = (req.body ?? {}) as Record<string, unknown>;
    if (typeof email !== "string" || email.trim() === "" || typeof password !== "string" || password === "") {
      throw badRequest("Email and password are required");
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { ...AUTH_USER_SELECT, passwordHash: true },
    });
    if (!user) {
      await verifyAgainstDummy(password);
      throw invalidCredentials();
    }
    if (!(await verifyPassword(password, user.passwordHash))) throw invalidCredentials();

    const token = await createSession(user.id, config.sessionTtlHours);
    res.cookie(SESSION_COOKIE, token, cookieOptions);
    const { passwordHash: _hash, ...publicUser } = user;
    res.json({ user: publicUser });
  });

  router.post("/logout", async (req, res) => {
    const token: unknown = req.cookies?.[SESSION_COOKIE];
    if (typeof token === "string" && token !== "") await deleteSession(token);
    clearSessionCookie(res, config.nodeEnv);
    res.status(204).end();
  });

  router.get("/me", requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}
