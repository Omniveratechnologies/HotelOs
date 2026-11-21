import { useState } from "react";
import { Input } from "@hotelos/ui/components";
import { forgotUsername, forgotPassword } from "@hotelos/api";

export default function RecoveryModal({ mode, onClose }) {
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryError, setRecoveryError] = useState("");

  async function handleRecovery(e) {
    e.preventDefault();

    setRecoveryMessage("");
    setRecoveryError("");

    if (!recoveryInput.trim()) {
      setRecoveryError(
        mode === "username"
          ? "Please enter your email address."
          : "Please enter your email or username.",
      );
      return;
    }

    setRecoveryLoading(true);

    try {
      const message =
        mode === "username"
          ? await forgotUsername(recoveryInput, "RECEPTIONIST")
          : await forgotPassword(recoveryInput, "RECEPTIONIST");

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
      <div className="border-brand-900/10 w-full max-w-md rounded-2xl border bg-white p-7 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-display text-brand-900 text-2xl font-semibold">
              {mode === "username" ? "Forgot username?" : "Forgot password?"}
            </h2>
            <p className="text-brand-900/60 mt-1 text-sm">
              {mode === "username"
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
              mode === "username"
                ? "Registered Email"
                : "Registered Email or Username"
            }
            type={mode === "username" ? "email" : "text"}
            required
            autoFocus
            value={recoveryInput}
            onChange={(e) => setRecoveryInput(e.target.value)}
            placeholder={
              mode === "username"
                ? "you@hotel.com"
                : "you@hotel.com or username"
            }
          />

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
              className="border-brand-900/15 text-brand-900 hover:bg-background-100 rounded-lg border px-5 py-2.5 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={recoveryLoading}
              className="bg-brand-900 text-background-50 hover:bg-brand-800 rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60"
            >
              {recoveryLoading
                ? "Sending..."
                : mode === "username"
                  ? "Send Username"
                  : "Send Instructions"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
