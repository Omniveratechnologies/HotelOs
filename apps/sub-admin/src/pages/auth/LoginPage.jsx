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

      const from =
        location.state?.from?.pathname || "/dashboard";

      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message || "Unable to login"
      );
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
    <div className="min-h-screen bg-ivory flex items-center justify-center px-6 relative">

      {/* Logo */}
      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center gap-2.5"
      >
        <span className="w-9 h-9 rounded-full bg-navy flex items-center justify-center">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
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
      <div className="w-full max-w-sm bg-cream border border-beige-border rounded-2xl shadow-soft px-8 py-10">

        <h1 className="font-display text-3xl font-semibold text-navy mb-1">
          Hello Admin.
        </h1>

        <p className="text-navy/60 mb-8">
          Welcome back.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-navy mb-1.5"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="your.username"
              className="w-full bg-ivory border border-beige-border rounded-lg px-4 py-2.5 text-navy placeholder:text-muted outline-none focus:border-gold transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-navy mb-1.5"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
              className="w-full bg-ivory border border-beige-border rounded-lg px-4 py-2.5 text-navy placeholder:text-muted outline-none focus:border-gold transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
              {success}
            </div>
          )}

          {/* Login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-cream font-medium rounded-lg px-5 py-3 hover:bg-navy-dark transition-colors mt-2 disabled:opacity-60"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

          {/* Recovery links */}
          <div className="flex items-center justify-between pt-1 text-sm">

            <button
              type="button"
              onClick={() => {
                setRecoveryMode("username");
                setError("");
              }}
              className="text-navy/70 hover:text-gold transition-colors"
            >
              Forgot username?
            </button>

            <button
              type="button"
              onClick={() => {
                setRecoveryMode("password");
                setError("");
              }}
              className="text-navy/70 hover:text-gold transition-colors"
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
        <RecoveryModal
          recoveryMode={recoveryMode}
          onClose={closeRecovery}
        />
      )}

    </div>
  );
}
