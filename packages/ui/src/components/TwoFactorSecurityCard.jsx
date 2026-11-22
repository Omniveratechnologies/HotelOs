import { useState, useEffect } from "react";
import { authApi } from "@hotelos/api";
import { Modal } from "./Modal.jsx";
import { Button } from "./Button.jsx";
import { Input } from "./Input.jsx";
import { cn } from "@hotelos/utils";

/**
 * Two-Factor Authentication Security Card & Setup/Management Modal.
 * Provides full end-to-end 2FA enablement, backup codes management, and disable flows.
 *
 * @param {object} props
 * @param {string} [props.className]
 * @param {'light'|'dark'} [props.theme='light']
 */
export function TwoFactorSecurityCard({ className = "", theme = "light" }) {
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({
    enabled: false,
    required: false,
    backupCodesRemaining: 0,
  });
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  // Setup modal state
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [verifyToken, setVerifyToken] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Disable modal state
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState("");

  // Backup codes modal state
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [regenPassword, setRegenPassword] = useState("");
  const [newBackupCodes, setNewBackupCodes] = useState(null);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState("");

  const fetchStatus = async () => {
    try {
      const res = await authApi.get2FAStatus();
      setError("");
      setStatus({
        enabled: Boolean(res?.enabled),
        required: Boolean(res?.required),
        backupCodesRemaining: res?.backupCodesRemaining ?? 0,
      });
    } catch (err) {
      setError(err.message || "Failed to load 2FA status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function loadStatus() {
      try {
        const res = await authApi.get2FAStatus();
        if (ignore) return;
        setStatus({
          enabled: Boolean(res?.enabled),
          required: Boolean(res?.required),
          backupCodesRemaining: res?.backupCodesRemaining ?? 0,
        });
      } catch (err) {
        if (ignore) return;
        setError(err.message || "Failed to load 2FA status.");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadStatus();

    return () => {
      ignore = true;
    };
  }, []);

  const handleStartSetup = async () => {
    try {
      setSetupLoading(true);
      setSetupError("");
      const data = await authApi.setup2FA();
      setSetupData(data);
      setVerifyToken("");
      setCopiedCodes(false);
      setCopiedKey(false);
      setSetupModalOpen(true);
    } catch (err) {
      setError(err.message || "Failed to initiate 2FA setup.");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerifySetup = async (e) => {
    e.preventDefault();
    if (!verifyToken.trim()) {
      setSetupError("Please enter the 6-digit verification code.");
      return;
    }

    try {
      setSetupLoading(true);
      setSetupError("");
      await authApi.verify2FASetup(verifyToken.trim());
      setSetupModalOpen(false);
      setSetupData(null);
      setVerifyToken("");
      setFeedback("Two-factor authentication has been successfully enabled.");
      setTimeout(() => setFeedback(""), 4000);
      await fetchStatus();
    } catch (err) {
      setSetupError(err.message || "Invalid verification code.");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    if (!disablePassword) {
      setDisableError("Password is required to disable 2FA.");
      return;
    }

    try {
      setDisableLoading(true);
      setDisableError("");
      await authApi.disable2FA({ password: disablePassword });
      setDisableModalOpen(false);
      setDisablePassword("");
      setFeedback("Two-factor authentication has been disabled.");
      setTimeout(() => setFeedback(""), 4000);
      await fetchStatus();
    } catch (err) {
      setDisableError(err.message || "Failed to disable 2FA.");
    } finally {
      setDisableLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async (e) => {
    e.preventDefault();
    if (!regenPassword) {
      setRegenError("Password is required to regenerate backup codes.");
      return;
    }

    try {
      setRegenLoading(true);
      setRegenError("");
      const res = await authApi.regenerateBackupCodes({
        password: regenPassword,
      });
      setNewBackupCodes(res.backupCodes || []);
      setRegenPassword("");
      await fetchStatus();
    } catch (err) {
      setRegenError(err.message || "Failed to regenerate backup codes.");
    } finally {
      setRegenLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "codes") {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-colors sm:p-6",
        isDark
          ? "border-neutral-800 bg-[#1e1e1e] text-neutral-100"
          : "border-surface-200 text-brand-900 bg-white",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              status.enabled
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-primary-500/10 text-primary-600 dark:text-primary-400",
            )}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              {status.enabled && <path d="m9 12 2 2 4-4" />}
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold sm:text-lg">
                Two-Factor Authentication (2FA)
              </h3>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  status.enabled
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400",
                )}
              >
                {status.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p
              className={cn(
                "mt-1 text-sm leading-relaxed",
                isDark ? "text-neutral-400" : "text-brand-700/70",
              )}
            >
              Protect your account by requiring an authenticator code (Google
              Authenticator, 1Password, Authy) whenever you sign in.
            </p>
            {status.enabled && (
              <p
                className={cn(
                  "mt-1 text-xs",
                  isDark ? "text-neutral-400" : "text-gray-500",
                )}
              >
                Backup codes remaining:{" "}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {status.backupCodesRemaining}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
          {loading ? (
            <span className="text-xs text-gray-400">Loading...</span>
          ) : status.enabled ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setNewBackupCodes(null);
                  setRegenPassword("");
                  setRegenError("");
                  setBackupModalOpen(true);
                }}
                className={cn(
                  "cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition",
                  isDark
                    ? "border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                )}
              >
                Backup Codes
              </button>
              <button
                type="button"
                onClick={() => {
                  setDisablePassword("");
                  setDisableError("");
                  setDisableModalOpen(true);
                }}
                className="cursor-pointer rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400"
              >
                Disable 2FA
              </button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              loading={setupLoading}
              onClick={handleStartSetup}
            >
              Enable 2FA
            </Button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {feedback}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* SETUP MODAL */}
      <Modal
        open={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        title="Set up Two-Factor Authentication"
        subtitle="Follow these 3 steps to configure your authenticator app."
        maxWidth="lg"
      >
        {setupData && (
          <form onSubmit={handleVerifySetup} className="space-y-6">
            {setupError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {setupError}
              </div>
            )}

            {/* STEP 1: SCAN QR */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-primary-100 text-primary-700 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                  1
                </span>
                <h4 className="text-sm font-semibold">Scan QR Code</h4>
              </div>
              <p className="text-xs text-gray-500">
                Open your authenticator app (e.g. Google Authenticator,
                Microsoft Authenticator, Authy) and scan this QR code:
              </p>

              <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-4">
                {setupData.qrCodeUrl ? (
                  <img
                    src={setupData.qrCodeUrl}
                    alt="2FA QR Code"
                    className="h-44 w-44 rounded-lg shadow-xs"
                  />
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center text-xs text-gray-400">
                    QR code not available
                  </div>
                )}
                {setupData.manualEntryKey && (
                  <div className="mt-3 flex w-full max-w-sm items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs">
                    <span className="truncate font-mono text-gray-600 select-all">
                      {setupData.manualEntryKey}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(setupData.manualEntryKey, "key")
                      }
                      className="text-primary-600 hover:text-primary-700 ml-2 cursor-pointer font-semibold"
                    >
                      {copiedKey ? "Copied" : "Copy key"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 2: BACKUP CODES */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-primary-100 text-primary-700 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                    2
                  </span>
                  <h4 className="text-sm font-semibold">Save Backup Codes</h4>
                </div>
                {setupData.backupCodes?.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(setupData.backupCodes.join("\n"), "codes")
                    }
                    className="text-primary-600 hover:text-primary-700 cursor-pointer text-xs font-semibold"
                  >
                    {copiedCodes ? "Codes copied!" : "Copy all codes"}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Store these emergency recovery codes safely. Each can be used
                once if you lose your phone.
              </p>

              <div className="grid grid-cols-2 gap-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3 sm:grid-cols-5">
                {setupData.backupCodes?.map((code) => (
                  <div
                    key={code}
                    className="rounded border border-amber-100 bg-white px-2 py-1 text-center font-mono text-xs font-medium text-gray-800 shadow-2xs"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 3: VERIFY TOKEN */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-primary-100 text-primary-700 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                  3
                </span>
                <h4 className="text-sm font-semibold">
                  Enter 6-Digit Code from App
                </h4>
              </div>
              <Input
                value={verifyToken}
                onChange={(e) =>
                  setVerifyToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                className="text-center font-mono text-lg tracking-widest"
                maxLength={6}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3">
              <Button
                variant="secondary"
                onClick={() => setSetupModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={setupLoading}>
                Verify & Enable 2FA
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* DISABLE MODAL */}
      <Modal
        open={disableModalOpen}
        onClose={() => setDisableModalOpen(false)}
        title="Disable Two-Factor Authentication"
        subtitle="Please enter your account password to confirm."
        maxWidth="md"
      >
        <form onSubmit={handleDisable2FA} className="space-y-4">
          {disableError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {disableError}
            </div>
          )}

          <Input
            label="Account Password"
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            required
          />

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3">
            <Button
              variant="secondary"
              onClick={() => setDisableModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={disableLoading}>
              Confirm & Disable
            </Button>
          </div>
        </form>
      </Modal>

      {/* BACKUP CODES MODAL */}
      <Modal
        open={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        title="Emergency Backup Codes"
        subtitle="Regenerate or view backup codes for recovery."
        maxWidth="md"
      >
        <div className="space-y-5">
          {newBackupCodes ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                New backup codes generated! Save them now; previous codes are
                invalidated.
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                {newBackupCodes.map((code) => (
                  <div
                    key={code}
                    className="rounded border border-gray-200 bg-white p-2 text-center font-mono text-xs font-semibold text-gray-800 shadow-2xs"
                  >
                    {code}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(newBackupCodes.join("\n"), "codes")
                  }
                >
                  {copiedCodes ? "Copied!" : "Copy All Codes"}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setBackupModalOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegenerateBackupCodes} className="space-y-4">
              <p className="text-xs leading-relaxed text-gray-500">
                You have{" "}
                <span className="font-semibold text-emerald-600">
                  {status.backupCodesRemaining}
                </span>{" "}
                unused backup code(s) remaining. Regenerating will invalidate
                all existing codes.
              </p>

              {regenError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {regenError}
                </div>
              )}

              <Input
                label="Account Password"
                type="password"
                value={regenPassword}
                onChange={(e) => setRegenPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                required
              />

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3">
                <Button
                  variant="secondary"
                  onClick={() => setBackupModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={regenLoading}>
                  Regenerate Codes
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default TwoFactorSecurityCard;
