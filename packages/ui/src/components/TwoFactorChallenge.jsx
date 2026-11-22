import { useState } from "react";
import { authApi } from "@hotelos/api";
import { Input } from "./Input.jsx";
import { cn } from "@hotelos/utils";

/**
 * Two-Factor Authentication Login Challenge Screen.
 * Renders when a user with 2FA enabled provides valid username & password.
 *
 * @param {object} props
 * @param {string} props.userId
 * @param {string} [props.username]
 * @param {string} [props.expectedRole]
 * @param {() => void} props.onSuccess
 * @param {() => void} props.onCancel
 * @param {'light'|'dark'} [props.theme='light']
 */
export function TwoFactorChallenge({
  userId,
  username,
  expectedRole,
  onSuccess,
  onCancel,
  theme = "light",
}) {
  const isDark = theme === "dark";

  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmed = code.trim();
    if (!trimmed) {
      setError(
        useBackupCode
          ? "Please enter an 8-character backup code."
          : "Please enter the 6-digit verification code.",
      );
      return;
    }

    try {
      setLoading(true);

      await authApi.verify2FALogin({
        userId,
        ...(useBackupCode ? { backupCode: trimmed } : { token: trimmed }),
        expectedRole,
      });

      onSuccess?.();
    } catch (err) {
      console.error("2FA verification failed:", err);
      setError(err.message || "Invalid authentication code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "w-full max-w-md rounded-2xl border p-8 shadow-xl transition-all",
        isDark
          ? "border-neutral-800 bg-[#1e1e1e] text-neutral-100"
          : "border-surface-200 text-brand-900 bg-white",
      )}
    >
      <div className="mb-6 text-center">
        <div
          className={cn(
            "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl",
            isDark
              ? "bg-primary-950/60 text-primary-400"
              : "bg-primary-50 text-primary-600",
          )}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>

        <h2 className="font-display text-xl font-bold">
          Two-Factor Authentication
        </h2>
        <p
          className={cn(
            "mt-1 text-sm",
            isDark ? "text-neutral-400" : "text-brand-700/60",
          )}
        >
          {useBackupCode
            ? "Enter one of your 8-character emergency backup codes."
            : `Enter the 6-digit code from your authenticator app${username ? ` for ${username}` : ""}.`}
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            className={cn(
              "mb-2 block text-xs font-semibold tracking-wider uppercase",
              isDark ? "text-neutral-300" : "text-brand-900",
            )}
          >
            {useBackupCode ? "Backup Code" : "Verification Code"}
          </label>
          <Input
            value={code}
            onChange={(e) =>
              setCode(
                useBackupCode
                  ? e.target.value.toUpperCase().slice(0, 12)
                  : e.target.value.replace(/\D/g, "").slice(0, 6),
              )
            }
            placeholder={useBackupCode ? "XXXXXXXX" : "000000"}
            className={cn(
              "py-3 text-center font-mono text-xl tracking-widest",
              isDark && "border-neutral-700 bg-neutral-900 text-neutral-100",
            )}
            maxLength={useBackupCode ? 12 : 6}
            autoFocus
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full cursor-pointer rounded-lg px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
            isDark
              ? "bg-primary-500 hover:bg-primary-400 text-neutral-950"
              : "bg-brand-900 hover:bg-brand-800 text-white",
          )}
        >
          {loading ? "Verifying..." : "Verify & Sign In"}
        </button>

        <div className="flex flex-col gap-2 pt-2 text-center text-xs">
          <button
            type="button"
            onClick={() => {
              setError("");
              setCode("");
              setUseBackupCode(!useBackupCode);
            }}
            className={cn(
              "cursor-pointer font-medium transition hover:underline",
              isDark ? "text-primary-400" : "text-primary-600",
            )}
          >
            {useBackupCode
              ? "Use 6-digit authenticator code instead"
              : "Don't have your phone? Use a backup code"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className={cn(
              "cursor-pointer transition hover:underline",
              isDark ? "text-neutral-400" : "text-gray-500",
            )}
          >
            Back to login
          </button>
        </div>
      </form>
    </div>
  );
}

export default TwoFactorChallenge;
