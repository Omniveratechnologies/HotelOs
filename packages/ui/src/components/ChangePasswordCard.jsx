import { useState } from "react";
import { authApi } from "@hotelos/api";
import { Button } from "./Button.jsx";
import { cn } from "@hotelos/utils";

function LockIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function CheckIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DotIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
    </svg>
  );
}

/**
 * ChangePasswordCard component.
 * Allows authenticated users to update their password with verification of current password,
 * new password input, confirmation, and real-time password strength enforcement.
 *
 * @param {object} props
 * @param {string} [props.className]
 * @param {'light'|'dark'} [props.theme='light']
 */
export function ChangePasswordCard({ className = "", theme = "light" }) {
  const isDark = theme === "dark";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  // Real-time strength criteria corresponding to backend passwordStrengthSchema
  const criteria = [
    {
      id: "length",
      label: "At least 8 characters",
      met: newPassword.length >= 8,
    },
    {
      id: "uppercase",
      label: "At least one uppercase letter (A-Z)",
      met: /[A-Z]/.test(newPassword),
    },
    {
      id: "lowercase",
      label: "At least one lowercase letter (a-z)",
      met: /[a-z]/.test(newPassword),
    },
    {
      id: "number",
      label: "At least one number (0-9)",
      met: /[0-9]/.test(newPassword),
    },
    {
      id: "special",
      label: "At least one special character (!@#$%...)",
      met: /[^a-zA-Z0-9]/.test(newPassword),
    },
    {
      id: "noWhitespace",
      label: "No spaces",
      met: newPassword.length > 0 && !/\s/.test(newPassword),
    },
  ];

  const metCount = criteria.filter((c) => c.met).length;
  const allCriteriaMet = criteria.every((c) => c.met);
  const passwordsMatch =
    confirmPassword.length > 0 && confirmPassword === newPassword;
  const isFormValid =
    currentPassword.trim().length > 0 && allCriteriaMet && passwordsMatch;

  // Strength score and label
  const getStrengthInfo = () => {
    if (!newPassword) {
      return { score: 0, label: "", colorClass: "" };
    }
    if (metCount <= 2) {
      return {
        score: 1,
        label: "Weak",
        colorClass: "bg-rose-500 text-rose-500",
        barWidth: "33%",
      };
    }
    if (metCount <= 4) {
      return {
        score: 2,
        label: "Medium",
        colorClass: "bg-amber-500 text-amber-500",
        barWidth: "66%",
      };
    }
    return {
      score: 3,
      label: "Strong",
      colorClass: "bg-emerald-500 text-emerald-500",
      barWidth: "100%",
    };
  };

  const strengthInfo = getStrengthInfo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    try {
      setLoading(true);
      setError("");
      setFeedback("");

      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setFeedback(res?.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);

      setTimeout(() => {
        setFeedback("");
      }, 5000);
    } catch (err) {
      setError(err?.message || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-xs transition sm:p-6",
        isDark
          ? "border-neutral-800 bg-neutral-900 text-white"
          : "text-brand-900 border-gray-100 bg-white",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            isDark
              ? "bg-primary-500/10 text-primary-400"
              : "bg-primary-500/10 text-primary-600",
          )}
        >
          <LockIcon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-base font-bold sm:text-lg">
            Change Password
          </h3>
          <p
            className={cn(
              "mt-1 text-sm leading-relaxed",
              isDark ? "text-neutral-400" : "text-brand-700/70",
            )}
          >
            Update your password regularly to protect your account. Make sure to
            use a strong password with letters, numbers, and symbols.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* CURRENT PASSWORD */}
        <div className="space-y-1.5">
          <label
            htmlFor="currentPassword"
            className={cn(
              "block text-xs font-semibold tracking-wider uppercase",
              isDark ? "text-neutral-300" : "text-brand-900",
            )}
          >
            Current Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              disabled={loading}
              autoComplete="current-password"
              className={cn(
                "w-full rounded-xl border px-3.5 py-2.5 pr-11 text-sm transition outline-none",
                isDark
                  ? "focus:border-primary-500 focus:ring-primary-500/20 border-neutral-700 bg-neutral-800/80 text-white placeholder:text-neutral-500 focus:ring-2"
                  : "text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 border-gray-200 bg-white placeholder:text-gray-400 focus:ring-2",
                loading && "cursor-not-allowed opacity-60",
              )}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              tabIndex={-1}
              aria-label={
                showCurrent ? "Hide current password" : "Show current password"
              }
              className={cn(
                "absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 transition",
                isDark
                  ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
                  : "hover:text-brand-900 text-gray-400 hover:bg-gray-100",
              )}
            >
              {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* NEW PASSWORD & CONFIRM PASSWORD GRID */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* NEW PASSWORD */}
          <div className="space-y-1.5">
            <label
              htmlFor="newPassword"
              className={cn(
                "block text-xs font-semibold tracking-wider uppercase",
                isDark ? "text-neutral-300" : "text-brand-900",
              )}
            >
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                disabled={loading}
                autoComplete="new-password"
                className={cn(
                  "w-full rounded-xl border px-3.5 py-2.5 pr-11 text-sm transition outline-none",
                  isDark
                    ? "focus:border-primary-500 focus:ring-primary-500/20 border-neutral-700 bg-neutral-800/80 text-white placeholder:text-neutral-500 focus:ring-2"
                    : "text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 border-gray-200 bg-white placeholder:text-gray-400 focus:ring-2",
                  loading && "cursor-not-allowed opacity-60",
                )}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                tabIndex={-1}
                aria-label={showNew ? "Hide new password" : "Show new password"}
                className={cn(
                  "absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 transition",
                  isDark
                    ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
                    : "hover:text-brand-900 text-gray-400 hover:bg-gray-100",
                )}
              >
                {showNew ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className={cn(
                "block text-xs font-semibold tracking-wider uppercase",
                isDark ? "text-neutral-300" : "text-brand-900",
              )}
            >
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                disabled={loading}
                autoComplete="new-password"
                className={cn(
                  "w-full rounded-xl border px-3.5 py-2.5 pr-11 text-sm transition outline-none",
                  isDark
                    ? "focus:border-primary-500 focus:ring-primary-500/20 border-neutral-700 bg-neutral-800/80 text-white placeholder:text-neutral-500 focus:ring-2"
                    : "text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 border-gray-200 bg-white placeholder:text-gray-400 focus:ring-2",
                  loading && "cursor-not-allowed opacity-60",
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
                aria-label={
                  showConfirm
                    ? "Hide confirmed password"
                    : "Show confirmed password"
                }
                className={cn(
                  "absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 transition",
                  isDark
                    ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
                    : "hover:text-brand-900 text-gray-400 hover:bg-gray-100",
                )}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p
                className={cn(
                  "text-xs font-medium",
                  passwordsMatch
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-500 dark:text-rose-400",
                )}
              >
                {passwordsMatch
                  ? "✓ Passwords match"
                  : "✕ Passwords do not match"}
              </p>
            )}
          </div>
        </div>

        {/* PASSWORD STRENGTH METER & CHECKLIST */}
        {newPassword.length > 0 && (
          <div
            className={cn(
              "rounded-xl border p-3.5 transition",
              isDark
                ? "border-neutral-800 bg-neutral-800/40"
                : "border-gray-100 bg-gray-50/70",
            )}
          >
            {/* Strength Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span
                  className={cn(
                    "font-medium",
                    isDark ? "text-neutral-400" : "text-gray-500",
                  )}
                >
                  Password Strength:
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    strengthInfo.label === "Weak" &&
                      "text-rose-600 dark:text-rose-400",
                    strengthInfo.label === "Medium" &&
                      "text-amber-600 dark:text-amber-400",
                    strengthInfo.label === "Strong" &&
                      "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {strengthInfo.label}
                </span>
              </div>
              <div
                className={cn(
                  "h-1.5 w-full overflow-hidden rounded-full",
                  isDark ? "bg-neutral-700" : "bg-gray-200",
                )}
              >
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    strengthInfo.label === "Weak" && "bg-rose-500",
                    strengthInfo.label === "Medium" && "bg-amber-500",
                    strengthInfo.label === "Strong" && "bg-emerald-500",
                  )}
                  style={{ width: strengthInfo.barWidth }}
                />
              </div>
            </div>

            {/* Criteria Checklist */}
            <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
              {criteria.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-2 transition-colors",
                    item.met
                      ? "text-emerald-600 dark:text-emerald-400"
                      : isDark
                        ? "text-neutral-400"
                        : "text-gray-500",
                  )}
                >
                  {item.met ? (
                    <CheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <DotIcon className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-neutral-500" />
                  )}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!isFormValid || loading}
          >
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
}
