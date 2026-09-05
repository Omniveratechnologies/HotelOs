import { useMemo, useState, type ReactNode } from "react";
import { AuthContext } from "./auth-context";
import {
  login as loginApi,
  logout as logoutApi,
  type LoginResponse,
} from "@/services/authApi";

type AuthUser = LoginResponse["user"];

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const initialUser = localStorage.getItem("auth_user");
    if (initialUser) {
      try {
        return JSON.parse(initialUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem("auth_token"),
  );
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (username: string, password: string) => {
    setError(null);
    try {
      const result = await loginApi(username, password);
      if (result.user.role !== "GUEST") {
        throw new Error("This login is for guests only");
      }
      localStorage.setItem("auth_token", result.token);
      localStorage.setItem("auth_user", JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
  };

  const value = useMemo<AuthState>(
    () => ({ user, token, loading, error, login, logout }),
    // oxlint-disable-next-line react/memo-dependencies -- `login`/`logout` are plain async closures recreated each render; guarding on the state they depend on keeps the memo correct
    [user, token, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
