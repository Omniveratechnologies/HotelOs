import { useState } from "react";
import { forgotPassword, forgotUsername } from "@hotelos/api";

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
          ? await forgotUsername(recoveryInput, "KITCHEN")
          : await forgotPassword(recoveryInput, "KITCHEN");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] p-7 text-white shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              {mode === "username" ? "Forgot username?" : "Forgot password?"}
            </h2>
            <p className="mt-1 text-sm text-white/60">
              {mode === "username"
                ? "Enter your registered email and we'll send your username."
                : "Enter your registered email or username and we'll send password reset instructions."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xl text-white/50 transition-colors hover:text-white"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleRecovery} className="space-y-5">
          <div>
            <label
              htmlFor="recoveryInput"
              className="mb-1.5 block text-sm font-medium text-white/80"
            >
              {mode === "username"
                ? "Registered Email"
                : "Registered Email or Username"}
            </label>
            <input
              id="recoveryInput"
              type={mode === "username" ? "email" : "text"}
              required
              autoFocus
              value={recoveryInput}
              onChange={(e) => setRecoveryInput(e.target.value)}
              placeholder={
                mode === "username"
                  ? "chef@hotel.com"
                  : "chef@hotel.com or username"
              }
              className="w-full rounded-lg border border-white/15 bg-[#0f0f0f] px-4 py-2.5 text-white transition-colors outline-none focus:border-amber-500"
            />
          </div>

          {/* Recovery error */}
          {recoveryError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {recoveryError}
            </div>
          )}

          {/* Recovery message */}
          {recoveryMessage && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              {recoveryMessage}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/5"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={recoveryLoading}
              className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-[#0f0f0f] transition-colors hover:bg-amber-400 disabled:opacity-60"
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
