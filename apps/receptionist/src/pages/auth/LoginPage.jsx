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
    <div className="bg-cream-50 relative flex min-h-screen items-center justify-center px-6">
      {/* Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-2.5">
        <span className="bg-navy-900 flex h-9 w-9 items-center justify-center rounded-full">
          <svg viewBox="0 0 24 24" fill="#c9a84c" className="h-4 w-4">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </span>
        <span className="font-display text-navy-900 text-xl font-semibold tracking-wide">
          Hotel<span className="text-gold-400">OS</span>
        </span>
      </div>

      {/* Login Card */}
      <div className="border-navy-900/10 w-full max-w-sm rounded-2xl border bg-white px-8 py-10 shadow-xl">
        <h1 className="font-display text-navy-900 mb-1 text-3xl font-semibold">
          Hello Receptionist.
        </h1>
        <p className="text-navy-900/60 mb-8">Welcome back.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="text-navy-900 mb-1.5 block text-sm font-medium"
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
              className="border-navy-900/15 bg-cream-50 text-navy-900 focus:border-gold-400 w-full rounded-lg border px-4 py-2.5 outline-hidden transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="text-navy-900 mb-1.5 block text-sm font-medium"
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
              className="border-navy-900/15 bg-cream-50 text-navy-900 focus:border-gold-400 w-full rounded-lg border px-4 py-2.5 outline-hidden transition-colors"
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
            className="bg-navy-900 text-cream-50 hover:bg-navy-800 mt-2 w-full rounded-xl px-5 py-3 font-medium transition-colors disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Recovery links */}
          <div className="flex items-center justify-between pt-1 text-sm">
            <button
              type="button"
              onClick={() => setRecoveryMode("username")}
              className="text-navy-900/70 hover:text-gold-500 transition-colors"
            >
              Forgot username?
            </button>

            <button
              type="button"
              onClick={() => setRecoveryMode("password")}
              className="text-navy-900/70 hover:text-gold-500 transition-colors"
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
