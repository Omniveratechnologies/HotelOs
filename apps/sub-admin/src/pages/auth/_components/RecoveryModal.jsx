import { useState } from "react";

import {
  forgotPassword,
  forgotUsername,
} from "../../../services/auth.service.js";

export default function RecoveryModal({ recoveryMode, onClose }) {
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");

  const handleRecovery = async (e) => {
    e.preventDefault();

    setRecoveryLoading(true);
    setRecoveryMessage("");

    try {
      const message =
        recoveryMode === "username"
          ? await forgotUsername(recoveryEmail)
          : await forgotPassword(recoveryEmail);

      setRecoveryMessage(message);
    } catch (err) {
      console.error("Recovery error:", err);

      setRecoveryMessage(
        err.message || "Something went wrong. Please try again.",
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-md rounded-2xl border border-beige-border bg-cream p-7 shadow-soft">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-navy">
              {recoveryMode === "username"
                ? "Forgot username?"
                : "Forgot password?"}
            </h2>

            <p className="mt-1 text-sm text-navy/60">
              {recoveryMode === "username"
                ? "Enter your registered email and we'll send your username."
                : "Enter your registered email and we'll send you a password reset link."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xl text-navy/50 hover:text-navy"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleRecovery} className="space-y-5">
          <div>
            <label
              htmlFor="recoveryEmail"
              className="mb-1.5 block text-sm font-medium text-navy"
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
              className="w-full rounded-lg border border-beige-border bg-ivory px-4 py-2.5 text-navy outline-none transition-colors placeholder:text-muted focus:border-gold"
            />
          </div>

          {/* Recovery message */}
          {recoveryMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
              {recoveryMessage}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-beige-border px-5 py-2.5 text-navy transition-colors hover:bg-ivory"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={recoveryLoading}
              className="rounded-lg bg-navy px-5 py-2.5 text-cream transition-colors hover:bg-navy-dark disabled:opacity-60"
            >
              {recoveryLoading
                ? "Sending..."
                : recoveryMode === "username"
                  ? "Send Username"
                  : "Send Reset Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
