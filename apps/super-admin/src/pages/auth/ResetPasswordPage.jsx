import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { resetPassword } from "../../services/auth.service.js";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("Invalid or missing password reset link.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please enter your new password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await resetPassword({ token, password });

      setSuccess(
        "Your password has been reset successfully. Redirecting to login...",
      );

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-50 flex min-h-screen items-center justify-center px-6">
      <div className="border-surface-200 w-full max-w-sm rounded-2xl border bg-white px-8 py-10 shadow-lg">
        <Link to="/login" className="mb-8 flex items-center gap-2.5">
          <span className="bg-primary-500 text-brand-950 flex h-9 w-9 items-center justify-center rounded-xl">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
          </span>

          <span className="font-display text-brand-900 text-xl font-bold">
            Hotel<span className="text-primary-600">OS</span>
          </span>
        </Link>

        <h1 className="font-display text-brand-900 mb-1 text-2xl font-bold">
          Reset Password
        </h1>

        <p className="text-brand-700/60 mb-8 text-sm">
          Create a new password for your Super Admin account.
        </p>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="text-brand-900 mb-1.5 block text-sm font-medium"
            >
              New Password
            </label>

            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border-surface-200 bg-background-50 text-brand-900 placeholder:text-brand-700/40 focus:border-primary-400 w-full rounded-lg border px-4 py-2.5 transition-colors outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="text-brand-900 mb-1.5 block text-sm font-medium"
            >
              Confirm New Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="border-surface-200 bg-background-50 text-brand-900 placeholder:text-brand-700/40 focus:border-primary-400 w-full rounded-lg border px-4 py-2.5 transition-colors outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-brand-900 hover:bg-brand-800 w-full rounded-lg px-5 py-3 font-semibold text-white shadow-xs transition-colors disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-brand-700/70 hover:text-brand-900 text-sm font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
