// F-01 STUB: real implementation follows the failing tests.
import { createContext, useContext, type ReactNode } from "react";

export type Role = "REQUESTER" | "REVIEWER";

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
  const value: AuthState = { user: null, loading: false, login: async () => {}, logout: async () => {} };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
