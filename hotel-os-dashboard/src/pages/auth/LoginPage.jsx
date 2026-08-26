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
        const from =
          location.state?.from?.pathname || "/";

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
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-6 relative">
      {/* Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-full bg-[#0f1f3d] flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="#c9a84c" className="w-4 h-4">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          </svg>
        </span>
        <span className="font-display text-xl font-semibold text-navy-900 tracking-wide">
          Hotel<span className="text-gold-400">OS</span>
        </span>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-white border border-navy-900/10 rounded-2xl shadow-xl px-8 py-10">
        <h1 className="font-display text-3xl font-semibold text-navy-900 mb-1">
          Hello Receptionist.
        </h1>
        <p className="text-navy-900/60 mb-8">Welcome back.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-navy-900 mb-1.5"
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
              className="w-full bg-cream-50 border border-navy-900/15 rounded-lg px-4 py-2.5 text-navy-900 outline-none focus:border-gold-400 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-navy-900 mb-1.5"
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
              className="w-full bg-cream-50 border border-navy-900/15 rounded-lg px-4 py-2.5 text-navy-900 outline-none focus:border-gold-400 transition-colors"
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
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy-900 text-cream-50 font-medium rounded-xl px-5 py-3 hover:bg-navy-800 transition-colors mt-2 disabled:opacity-60"
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
