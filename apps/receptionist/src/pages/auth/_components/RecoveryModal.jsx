import { useState } from "react";
import {
  forgotUsername,
  forgotPassword,
} from "../../../services/auth.service.js";

export default function RecoveryModal({ mode, onClose }) {
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryError, setRecoveryError] = useState("");

  async function handleRecovery(e) {
    e.preventDefault();

    setRecoveryMessage("");
    setRecoveryError("");

    if (!recoveryEmail.trim()) {
      setRecoveryError("Please enter your email address.");
      return;
    }

    setRecoveryLoading(true);

    try {
      const message =
        mode === "username"
          ? await forgotUsername(recoveryEmail)
          : await forgotPassword(recoveryEmail);

      setRecoveryMessage(message);
    } catch (err) {
      console.error("Recovery error:", err);
      setRecoveryError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setRecoveryLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-navy-900/10 p-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-navy-900">
              {mode === "username"
                ? "Forgot username?"
                : "Forgot password?"}
            </h2>
            <p className="text-sm text-navy-900/60 mt-1">
              {mode === "username"
                ? "Enter your registered email and we'll send your username."
                : "Enter your registered email and we'll send you a password reset link."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-navy-900/50 hover:text-navy-900 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleRecovery} className="space-y-5">
          <div>
            <label
              htmlFor="recoveryEmail"
              className="block text-sm font-medium text-navy-900 mb-1.5"
            >
              Registered Email
            </label>
            <input
              id="recoveryEmail"
              type="email"
              required
              autoFocus
              value={recoveryEmail}
              onChange={(e) =>
                setRecoveryEmail(e.target.value)
              }
              placeholder="you@hotel.com"
              className="w-full bg-cream-50 border border-navy-900/15 rounded-lg px-4 py-2.5 text-navy-900 outline-none focus:border-gold-400 transition-colors"
            />
          </div>

          {/* Recovery error */}
          {recoveryError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {recoveryError}
            </div>
          )}

          {/* Recovery message */}
          {recoveryMessage && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {recoveryMessage}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-navy-900/15 text-navy-900 hover:bg-cream-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={recoveryLoading}
              className="px-5 py-2.5 rounded-lg bg-navy-900 text-cream-50 hover:bg-navy-800 transition-colors disabled:opacity-60"
            >
              {recoveryLoading
                ? "Sending..."
                : mode === "username"
                ? "Send Username"
                : "Send Reset Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
