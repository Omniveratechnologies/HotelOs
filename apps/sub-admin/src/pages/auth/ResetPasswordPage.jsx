import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { resetPassword } from "../../services/auth.service.js";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("This password reset link is invalid or missing.");
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

    setLoading(true);

    try {
      await resetPassword({ token, password });

      setSuccess(
        "Your password has been reset successfully. Redirecting to login...",
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      console.error("Reset password error:", err);

      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-50 flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white px-8 py-10 shadow-lg">
        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center gap-2.5">
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

        {/* Heading */}
        <h1 className="font-display text-brand-900 mb-1 text-3xl font-semibold">
          Reset Password
        </h1>

        <p className="text-brand-900/60 mb-8">
          Create a new password for your HotelOS account.
        </p>

        {!token && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            This password reset link is invalid or missing.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New password */}
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="bg-background-50 text-brand-900 focus:border-primary-400 w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-hidden transition-colors placeholder:text-gray-500"
            />
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="text-brand-900 mb-1.5 block text-sm font-medium"
            >
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !token}
            className="bg-brand-900 hover:bg-brand-800 w-full rounded-lg px-5 py-3 font-medium text-white transition-colors disabled:opacity-60"
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-brand-900/70 hover:text-primary-500 text-sm transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
