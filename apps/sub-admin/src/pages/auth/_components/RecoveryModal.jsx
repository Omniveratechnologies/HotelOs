import { useState } from "react";

import {
  forgotPassword,
  forgotUsername,
} from "../../../services/auth.service.js";

export default function RecoveryModal({
  recoveryMode,
  onClose,
}) {
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
      console.error(
        "Recovery error:",
        err
      );

      setRecoveryMessage(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50">

      <div className="w-full max-w-md bg-cream rounded-2xl shadow-soft border border-beige-border p-7">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">

          <div>
            <h2 className="font-display text-2xl font-semibold text-navy">
              {recoveryMode === "username"
                ? "Forgot username?"
                : "Forgot password?"}
            </h2>

            <p className="text-sm text-navy/60 mt-1">
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

        <form
          onSubmit={handleRecovery}
          className="space-y-5"
        >

          <div>
            <label
              htmlFor="recoveryEmail"
              className="block text-sm font-medium text-navy mb-1.5"
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
              className="w-full bg-ivory border border-beige-border rounded-lg px-4 py-2.5 text-navy placeholder:text-muted outline-none focus:border-gold transition-colors"
            />
          </div>

          {/* Recovery message */}
          {recoveryMessage && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
              {recoveryMessage}
            </div>
          )}

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-beige-border text-navy hover:bg-ivory transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={recoveryLoading}
              className="px-5 py-2.5 rounded-lg bg-navy text-cream hover:bg-navy-dark transition-colors disabled:opacity-60"
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
