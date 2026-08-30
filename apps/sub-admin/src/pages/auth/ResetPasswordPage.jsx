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
    <div className="flex min-h-screen items-center justify-center bg-ivory px-6">
      <div className="w-full max-w-md rounded-2xl border border-beige-border bg-cream px-8 py-10 shadow-soft">
        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center gap-2.5">
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

        {/* Heading */}
        <h1 className="mb-1 font-display text-3xl font-semibold text-navy">
          Reset Password
        </h1>

        <p className="mb-8 text-navy/60">
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
              className="mb-1.5 block text-sm font-medium text-navy"
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
              className="w-full rounded-lg border border-beige-border bg-ivory px-4 py-2.5 text-navy outline-none transition-colors placeholder:text-muted focus:border-gold"
            />
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-navy"
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-lg bg-navy px-5 py-3 font-medium text-cream transition-colors hover:bg-navy-dark disabled:opacity-60"
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-navy/70 transition-colors hover:text-gold"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
