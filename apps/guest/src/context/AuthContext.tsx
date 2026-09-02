import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  login as loginApi,
  logout as logoutApi,
  type LoginResponse,
} from "@/services/authApi";

type AuthUser = LoginResponse["user"];

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("hotelos_token");
    const storedUser = localStorage.getItem("hotelos_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setError(null);
    try {
      const result = await loginApi(username, password);
      if (result.user.role !== "GUEST") {
        throw new Error("This login is for guests only");
      }
      localStorage.setItem("hotelos_token", result.token);
      localStorage.setItem("hotelos_user", JSON.stringify(result.user));
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
    localStorage.removeItem("hotelos_token");
    localStorage.removeItem("hotelos_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, error, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
