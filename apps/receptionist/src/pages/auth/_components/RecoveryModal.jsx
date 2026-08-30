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
        err.message || "Something went wrong. Please try again.",
      );
    } finally {
      setRecoveryLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="border-navy-900/10 w-full max-w-md rounded-2xl border bg-white p-7 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-display text-navy-900 text-2xl font-semibold">
              {mode === "username" ? "Forgot username?" : "Forgot password?"}
            </h2>
            <p className="text-navy-900/60 mt-1 text-sm">
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
              className="text-navy-900 mb-1.5 block text-sm font-medium"
            >
              Registered Email
            </label>
            <input
              id="recoveryEmail"
              type="email"
              required
              autoFocus
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              placeholder="you@hotel.com"
              className="border-navy-900/15 bg-cream-50 text-navy-900 focus:border-gold-400 w-full rounded-lg border px-4 py-2.5 outline-hidden transition-colors"
            />
          </div>

          {/* Recovery error */}
          {recoveryError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {recoveryError}
            </div>
          )}

          {/* Recovery message */}
          {recoveryMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {recoveryMessage}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border-navy-900/15 text-navy-900 hover:bg-cream-100 rounded-lg border px-5 py-2.5 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={recoveryLoading}
              className="bg-navy-900 text-cream-50 hover:bg-navy-800 rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60"
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
