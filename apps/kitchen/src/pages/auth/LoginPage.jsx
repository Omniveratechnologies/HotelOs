import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { isAuthenticated, login } from "../../services/auth.service.js";

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ username, password });
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  }

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0f0f0f] px-6 text-white">
      <div className="absolute top-8 left-8 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
          <svg viewBox="0 0 24 24" fill="#f59e0b" className="h-4 w-4">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </span>
        <span className="text-xl font-semibold tracking-wide">
          Food<span className="text-amber-500">Hub</span>
        </span>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1a] px-8 py-10 shadow-xl">
        <h1 className="mb-1 text-3xl font-semibold">Hello Kitchen.</h1>
        <p className="mb-8 text-white/50">Welcome back.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-white/80"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your.username"
              className="w-full rounded-lg border border-white/15 bg-[#0f0f0f] px-4 py-2.5 text-white transition-colors outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-white/80"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/15 bg-[#0f0f0f] px-4 py-2.5 text-white transition-colors outline-none focus:border-amber-500"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-amber-500 px-5 py-3 font-medium text-[#0f0f0f] transition-colors hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
