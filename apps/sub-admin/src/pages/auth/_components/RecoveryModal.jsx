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
      <div className="border-beige-border bg-cream shadow-soft w-full max-w-md rounded-2xl border p-7">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-display text-navy text-2xl font-semibold">
              {recoveryMode === "username"
                ? "Forgot username?"
                : "Forgot password?"}
            </h2>

            <p className="text-navy/60 mt-1 text-sm">
              {recoveryMode === "username"
                ? "Enter your registered email and we'll send your username."
                : "Enter your registered email and we'll send you a password reset link."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-navy/50 hover:text-navy text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleRecovery} className="space-y-5">
          <div>
            <label
              htmlFor="recoveryEmail"
              className="text-navy mb-1.5 block text-sm font-medium"
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
              className="border-beige-border bg-ivory text-navy placeholder:text-muted focus:border-gold w-full rounded-lg border px-4 py-2.5 outline-hidden transition-colors"
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
              className="border-beige-border text-navy hover:bg-ivory rounded-lg border px-5 py-2.5 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={recoveryLoading}
              className="bg-navy text-cream hover:bg-navy-dark rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60"
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
