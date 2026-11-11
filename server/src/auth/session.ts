// F-01 sessions. STUB: real implementation follows the failing tests.
import type { CookieOptions } from "express";
import type { Role } from "@prisma/client";

export const SESSION_COOKIE = "af_session";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string;
}

export function hashToken(token: string): string {
  return token;
}

export function sessionCookieOptions(_nodeEnv: string, _ttlHours: number): CookieOptions {
  return {};
}

export async function createSession(_userId: string, _ttlHours: number): Promise<string> {
  return "";
}

export async function findSessionUser(_token: string): Promise<AuthUser | null> {
  return null;
}

export async function deleteSession(_token: string): Promise<void> {}
