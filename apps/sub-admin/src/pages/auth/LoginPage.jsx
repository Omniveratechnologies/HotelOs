import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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
    <div className="relative flex min-h-screen items-center justify-center bg-ivory px-6">
      {/* Logo */}
      <Link to="/" className="absolute left-8 top-8 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 21V9l8-5 8 5v12"
              stroke="#F4F4E4"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M9 21v-6h6v6"
              stroke="#766242"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <span className="font-display text-xl font-semibold text-navy">
          Hotel<span className="text-gold">OS</span>
        </span>
      </Link>

      {/* Login Card */}
      <div className="w-full max-w-sm rounded-2xl border border-beige-border bg-cream px-8 py-10 shadow-soft">
        <h1 className="mb-1 font-display text-3xl font-semibold text-navy">
          Hello Admin.
        </h1>

        <p className="mb-8 text-navy/60">Welcome back.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-navy"
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
              className="w-full rounded-lg border border-beige-border bg-ivory px-4 py-2.5 text-navy outline-none transition-colors placeholder:text-muted focus:border-gold"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-navy"
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
              className="w-full rounded-lg border border-beige-border bg-ivory px-4 py-2.5 text-navy outline-none transition-colors placeholder:text-muted focus:border-gold"
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
            className="mt-2 w-full rounded-lg bg-navy px-5 py-3 font-medium text-cream transition-colors hover:bg-navy-dark disabled:opacity-60"
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
              className="text-navy/70 transition-colors hover:text-gold"
            >
              Forgot username?
            </button>

            <button
              type="button"
              onClick={() => {
                setRecoveryMode("password");
                setError("");
              }}
              className="text-navy/70 transition-colors hover:text-gold"
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
