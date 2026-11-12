// F-01 sessions (D-05, D-06): a random token in an HttpOnly cookie; the
// database keeps only its SHA-256 hash, so a leaked table gives no usable token.
import crypto from "node:crypto";
import type { CookieOptions, Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../db";

export const SESSION_COOKIE = "af_session";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string;
}

export const AUTH_USER_SELECT = { id: true, email: true, name: true, role: true, department: true } as const;

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function sessionCookieOptions(nodeEnv: string, ttlHours: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: nodeEnv === "production",
    path: "/",
    maxAge: ttlHours * 3600 * 1000,
  };
}

// clearCookie must match the attributes the cookie was set with, minus its lifetime.
export function clearSessionCookie(res: Response, nodeEnv: string): void {
  const { maxAge: _maxAge, ...options } = sessionCookieOptions(nodeEnv, 1);
  res.clearCookie(SESSION_COOKIE, options);
}

// Returns the raw token for the cookie. Also deletes every expired session, so
// sessions abandoned without logout do not pile up (F-01 v2, AC-01-14).
export async function createSession(userId: string, ttlHours: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  await prisma.session.create({
    data: { id: hashToken(token), userId, expiresAt: new Date(Date.now() + ttlHours * 3600 * 1000) },
  });
  return token;
}

export async function findSessionUser(token: string): Promise<AuthUser | null> {
  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { select: AUTH_USER_SELECT } },
  });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    return null;
  }
  return session.user;
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: hashToken(token) } });
}
