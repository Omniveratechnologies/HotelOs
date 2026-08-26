import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { resetPassword } from "../../services/auth.service.js";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError(
        "This password reset link is invalid or missing."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      await resetPassword({ token, password });

      setSuccess(
        "Your password has been reset successfully. Redirecting to login..."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1800);

    } catch (err) {
      console.error(
        "Reset password error:",
        err
      );

      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-6">

      <div className="w-full max-w-md bg-cream border border-beige-border rounded-2xl shadow-soft px-8 py-10">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 mb-8"
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

        {/* Heading */}
        <h1 className="font-display text-3xl font-semibold text-navy mb-1">
          Reset Password
        </h1>

        <p className="text-navy/60 mb-8">
          Create a new password for your HotelOS account.
        </p>

        {!token && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 mb-5">
            This password reset link is invalid or missing.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* New password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-navy mb-1.5"
            >
              New Password
            </label>

            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter new password"
              className="w-full bg-ivory border border-beige-border rounded-lg px-4 py-2.5 text-navy placeholder:text-muted outline-none focus:border-gold transition-colors"
            />
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-navy mb-1.5"
            >
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              placeholder="Confirm new password"
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-navy text-cream font-medium rounded-lg px-5 py-3 hover:bg-navy-dark transition-colors disabled:opacity-60"
          >
            {loading
              ? "Resetting Password..."
              : "Reset Password"}
          </button>

        </form>

        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-sm text-navy/70 hover:text-gold transition-colors"
          >
            Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
}