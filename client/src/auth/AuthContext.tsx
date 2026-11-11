// F-01: who is signed in. Wrap the app in <AuthProvider> and read it with useAuth().
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, api } from "../api";

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    setUser(body.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function loginErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Cannot reach the server. Try again.";
}
