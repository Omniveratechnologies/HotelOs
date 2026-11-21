import { useState } from "react";

import { Input } from "@hotelos/ui/components";
import { forgotPassword, forgotUsername } from "@hotelos/api";

export default function RecoveryModal({ recoveryMode, onClose }) {
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");

  const handleRecovery = async (e) => {
    e.preventDefault();

    setRecoveryLoading(true);
    setRecoveryMessage("");

    try {
      const message =
        recoveryMode === "username"
          ? await forgotUsername(recoveryInput, "SUB_ADMIN")
          : await forgotPassword(recoveryInput, "SUB_ADMIN");

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
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-7 shadow-md">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-display text-brand-900 text-2xl font-semibold">
              {recoveryMode === "username"
                ? "Forgot username?"
                : "Forgot password?"}
            </h2>

            <p className="text-brand-900/60 mt-1 text-sm">
              {recoveryMode === "username"
                ? "Enter your registered email and we'll send your username."
                : "Enter your registered email or username and we'll send password reset instructions."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-brand-900/50 hover:text-brand-900 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleRecovery} className="space-y-5">
          <Input
            id="recoveryInput"
            name="recoveryInput"
            label={
              recoveryMode === "username"
                ? "Registered Email"
                : "Registered Email or Username"
            }
            type={recoveryMode === "username" ? "email" : "text"}
            required
            autoFocus
            value={recoveryInput}
            onChange={(e) => setRecoveryInput(e.target.value)}
            placeholder={
              recoveryMode === "username"
                ? "you@hotel.com"
                : "you@hotel.com or username"
            }
          />

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
              className="text-brand-900 rounded-lg border border-gray-200 px-5 py-2.5 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={recoveryLoading}
              className="bg-brand-900 hover:bg-brand-800 rounded-lg px-5 py-2.5 text-white transition-colors disabled:opacity-60"
            >
              {recoveryLoading
                ? "Sending..."
                : recoveryMode === "username"
                  ? "Send Username"
                  : "Send Instructions"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
