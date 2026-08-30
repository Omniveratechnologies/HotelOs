import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import RecoveryModal from "./_components/RecoveryModal.jsx";
import { isAuthenticated, login } from "../../services/auth.service.js";

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await login({ username, password });

      setSuccess("Login successful. Redirecting...");

      setTimeout(() => {
        const from = location.state?.from?.pathname || "/";

        navigate(from, { replace: true });
      }, 500);
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
    <div className="relative flex min-h-screen items-center justify-center bg-cream-50 px-6">
      {/* Logo */}
      <div className="absolute left-8 top-8 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f1f3d]">
          <svg viewBox="0 0 24 24" fill="#c9a84c" className="h-4 w-4">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </span>
        <span className="font-display text-xl font-semibold tracking-wide text-navy-900">
          Hotel<span className="text-gold-400">OS</span>
        </span>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm rounded-2xl border border-navy-900/10 bg-white px-8 py-10 shadow-xl">
        <h1 className="mb-1 font-display text-3xl font-semibold text-navy-900">
          Hello Receptionist.
        </h1>
        <p className="mb-8 text-navy-900/60">Welcome back.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-navy-900"
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
              className="w-full rounded-lg border border-navy-900/15 bg-cream-50 px-4 py-2.5 text-navy-900 outline-none transition-colors focus:border-gold-400"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-navy-900"
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
              className="w-full rounded-lg border border-navy-900/15 bg-cream-50 px-4 py-2.5 text-navy-900 outline-none transition-colors focus:border-gold-400"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Login */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-navy-900 px-5 py-3 font-medium text-cream-50 transition-colors hover:bg-navy-800 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Recovery links */}
          <div className="flex items-center justify-between pt-1 text-sm">
            <button
              type="button"
              onClick={() => setRecoveryMode("username")}
              className="text-navy-900/70 transition-colors hover:text-gold-500"
            >
              Forgot username?
            </button>

            <button
              type="button"
              onClick={() => setRecoveryMode("password")}
              className="text-navy-900/70 transition-colors hover:text-gold-500"
            >
              Forgot password?
            </button>
          </div>
        </form>
      </div>

      {/* RECOVERY MODAL */}
      {recoveryMode && (
        <RecoveryModal
          mode={recoveryMode}
          onClose={() => setRecoveryMode(null)}
        />
      )}
    </div>
  );
}
