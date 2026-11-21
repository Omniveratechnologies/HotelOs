import { useState } from "react";
import { forgotPassword, forgotUsername } from "@/services/authApi";

interface RecoveryModalProps {
  mode: "username" | "password";
  onClose: () => void;
}

export function RecoveryModal({ mode, onClose }: RecoveryModalProps) {
  const [recoveryInput, setRecoveryInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!recoveryInput.trim()) {
      setError(
        mode === "username"
          ? "Please enter your email address."
          : "Please enter your email or username.",
      );
      return;
    }

    setLoading(true);
    try {
      const resMessage =
        mode === "username"
          ? await forgotUsername(recoveryInput)
          : await forgotPassword(recoveryInput);

      setMessage(resMessage);
    } catch (err: unknown) {
      console.error("Recovery error:", err);
      const errMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(errMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-card text-card-foreground border-border w-full max-w-sm rounded-2xl border p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {mode === "username" ? "Forgot Username?" : "Forgot Password?"}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {mode === "username"
                ? "Enter your registered email and we'll send your username."
                : "Enter your registered email or username and we'll send reset instructions."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleRecovery} className="space-y-4">
          <div>
            <label
              htmlFor="guestRecoveryInput"
              className="text-foreground/80 mb-1.5 block text-sm font-medium"
            >
              {mode === "username"
                ? "Registered Email"
                : "Registered Email or Username"}
            </label>
            <input
              id="guestRecoveryInput"
              type={mode === "username" ? "email" : "text"}
              required
              autoFocus
              value={recoveryInput}
              onChange={(e) => setRecoveryInput(e.target.value)}
              placeholder={
                mode === "username"
                  ? "guest@example.com"
                  : "guest@example.com or username"
              }
              className="border-input bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          {error && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
              {message}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border-input hover:bg-accent text-foreground rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading
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
