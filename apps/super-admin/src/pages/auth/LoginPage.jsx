import { useState } from "react";
import { useNavigate } from "react-router";
import { login } from "../../services/auth.service.js";

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    try {
      setLoading(true);

      await login({ username, password });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-50 flex min-h-screen items-center justify-center px-4">
      <div className="border-surface-200 w-full max-w-md rounded-2xl border bg-white p-8 shadow-lg">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="bg-primary-500 text-brand-950 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 21V9l8-5 8 5v12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M9 21v-6h6v6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="font-display text-brand-900 text-2xl font-bold">
            Hotel<span className="text-primary-600">OS</span>
          </h1>

          <p className="text-brand-700/60 mt-1 text-sm">Super Admin Portal</p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-brand-900 mb-2 block text-sm font-medium">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="border-surface-200 bg-background-50 text-brand-900 focus:border-primary-400 focus:ring-primary-400/20 w-full rounded-lg border px-4 py-3 text-sm transition outline-none focus:ring-2"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-brand-900 mb-2 block text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="border-surface-200 bg-background-50 text-brand-900 focus:border-primary-400 focus:ring-primary-400/20 w-full rounded-lg border px-4 py-3 text-sm transition outline-none focus:ring-2"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-brand-900 hover:bg-brand-800 w-full rounded-lg px-4 py-3 font-semibold text-white shadow-xs transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
