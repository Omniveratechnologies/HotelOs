import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import RecoveryModal from "./_components/RecoveryModal.jsx";
import { login } from "../../services/auth.service.js";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [recoveryMode, setRecoveryMode] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // =====================================================
  // LOGIN
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await login({ username, password });

      setSuccess("Login successful. Redirecting...");

      const from = location.state?.from?.pathname || "/dashboard";

      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    } catch (err) {
      console.error("Login error:", err);

      setError(err.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CLOSE RECOVERY
  // =====================================================

  const closeRecovery = () => {
    setRecoveryMode(null);
  };

  return (
    <div className="bg-background-50 relative flex min-h-screen items-center justify-center px-6">
      {/* Logo */}
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2.5">
        <span className="bg-brand-900 flex h-9 w-9 items-center justify-center rounded-full">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 21V9l8-5 8 5v12"
              stroke="var(--color-surface-50)"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M9 21v-6h6v6"
              stroke="var(--color-primary-400)"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <span className="font-display text-brand-900 text-xl font-semibold">
          Hotel<span className="text-primary-400">OS</span>
        </span>
      </Link>

      {/* Login Card */}
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white px-8 py-10 shadow-lg">
        <h1 className="font-display text-brand-900 mb-1 text-3xl font-semibold">
          Hello Admin.
        </h1>

        <p className="text-brand-900/60 mb-8">Welcome back.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="text-brand-900 mb-1.5 block text-sm font-medium"
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
              className="bg-background-50 text-brand-900 focus:border-primary-400 w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-hidden transition-colors placeholder:text-gray-500"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="text-brand-900 mb-1.5 block text-sm font-medium"
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
              className="bg-background-50 text-brand-900 focus:border-primary-400 w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-hidden transition-colors placeholder:text-gray-500"
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
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
              {success}
            </div>
          )}

          {/* Login */}
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-900 hover:bg-brand-800 mt-2 w-full rounded-lg px-5 py-3 font-medium text-white transition-colors disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Recovery links */}
          <div className="flex items-center justify-between pt-1 text-sm">
            <button
              type="button"
              onClick={() => {
                setRecoveryMode("username");
                setError("");
              }}
              className="text-brand-900/70 hover:text-primary-500 transition-colors"
            >
              Forgot username?
            </button>

            <button
              type="button"
              onClick={() => {
                setRecoveryMode("password");
                setError("");
              }}
              className="text-brand-900/70 hover:text-primary-500 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </form>
      </div>

      {/* =====================================================
          RECOVERY MODAL
          ===================================================== */}

      {recoveryMode && (
        <RecoveryModal recoveryMode={recoveryMode} onClose={closeRecovery} />
      )}
    </div>
  );
}
