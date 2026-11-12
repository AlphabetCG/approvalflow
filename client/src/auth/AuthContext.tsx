// F-01: who is signed in. Wrap the app in <AuthProvider> and read it with useAuth().
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ApiError, api, setUnauthorizedHandler } from "../api";

export const SESSION_ENDED_MESSAGE = "Your session has ended. Please sign in again.";

export type Role = "REQUESTER" | "REVIEWER";

export const ROLE_LABELS: Record<Role, string> = { REQUESTER: "Requester", REVIEWER: "Reviewer" };

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  // Shown on the login page after the session ended on its own; null otherwise.
  notice: string | null;
  login: (email: string, password: string) => Promise<void>;
  // Rejects when sign-out fails; the user then stays signed in (AC-01-11).
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  // A 401 while signed in means the session ended (expired or deleted). A 401
  // while signed out (first /me, wrong password) is not a session end.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!userRef.current) return;
      setUser(null);
      setNotice(SESSION_ENDED_MESSAGE);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let active = true;
    api<{ user: User }>("/api/auth/me")
      .then((body) => active && setUser(body.user))
      .catch(() => active && setUser(null)) // 401 or server down: show the login page
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const body = await api<{ user: User }>("/api/auth/login", { method: "POST", body: { email, password } });
    setNotice(null);
    setUser(body.user);
  }, []);

  // Only clear the user once the server confirms: if the request fails, the
  // session may still be valid, so showing "signed out" would be wrong.
  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    setNotice(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, notice, login, logout }),
    [user, loading, notice, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// 4xx: the API's own message. Network failure or 5xx: the contract's message,
// never a raw "500 Internal Server Error" (AC-01-12).
export function loginErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status < 500) return err.message;
  return "Cannot reach the server. Try again.";
}
