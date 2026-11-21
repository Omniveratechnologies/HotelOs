import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  getResetPasswordAccounts,
  resetPassword,
  selectResetPasswordAccount,
} from "@hotelos/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlToken = searchParams.get("token");
  const selectionToken = searchParams.get("selectionToken");

  const [activeToken, setActiveToken] = useState(urlToken || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Multi-account selection state
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(
    Boolean(selectionToken && !urlToken),
  );
  const [selectedUsername, setSelectedUsername] = useState("");
  const [selectedAccountName, setSelectedAccountName] = useState("");

  useEffect(() => {
    if (selectionToken && !activeToken) {
      let isMounted = true;

      getResetPasswordAccounts(selectionToken)
        .then((data) => {
          if (!isMounted) return;
          const list = data?.accounts || [];
          setAccounts(list);
          if (list.length > 0) {
            setSelectedUsername(list[0].username);
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error("Failed to load accounts:", err);
          setError(
            err.message ||
              "This account selection link is invalid or has expired. Please request a new link.",
          );
        })
        .finally(() => {
          if (isMounted) setAccountsLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [selectionToken, activeToken]);

  const handleSelectAccount = async (e) => {
    e.preventDefault();
    if (!selectedUsername) {
      setError("Please select an account to proceed.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await selectResetPasswordAccount({
        token: selectionToken,
        username: selectedUsername,
      });

      if (res?.resetToken) {
        setActiveToken(res.resetToken);
        setSelectedAccountName(selectedUsername);
      } else {
        throw new Error("Unable to select account. Please try again.");
      }
    } catch (err) {
      console.error("Select account error:", err);
      setError(err.message || "Failed to select account.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!activeToken) {
      setError("Invalid or missing password reset link.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please enter your new password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await resetPassword({ token: activeToken, password });

      setSuccess(
        "Your password has been reset successfully. Redirecting to login...",
      );

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showAccountSelection = Boolean(selectionToken && !activeToken);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0f0f0f] px-6 text-white">
      {/* Brand Header */}
      <div className="absolute top-8 left-8 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
          <svg viewBox="0 0 24 24" fill="#f59e0b" className="h-4 w-4">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </span>
        <span className="text-xl font-semibold tracking-wide">
          Food<span className="text-amber-500">Hub</span>
        </span>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] px-8 py-10 shadow-xl">
        <h1 className="mb-1 text-2xl font-semibold">
          {showAccountSelection ? "Select Account" : "Reset Password"}
        </h1>

        <p className="mb-8 text-sm text-white/60">
          {showAccountSelection
            ? "Choose which account you would like to reset password for:"
            : selectedAccountName
              ? `Create a new password for account @${selectedAccountName}.`
              : "Create a new password for your Kitchen account."}
        </p>

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            {success}
          </div>
        )}

        {showAccountSelection ? (
          <div>
            {accountsLoading ? (
              <div className="py-8 text-center text-sm text-white/50">
                Loading accounts...
              </div>
            ) : accounts.length === 0 ? (
              <div className="py-4 text-center text-sm text-white/50">
                No accounts available for selection.
              </div>
            ) : (
              <form onSubmit={handleSelectAccount} className="space-y-4">
                <div className="space-y-2.5">
                  {accounts.map((acc) => {
                    const isSelected = selectedUsername === acc.username;
                    return (
                      <label
                        key={acc.username}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 shadow-xs"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <input
                          type="radio"
                          name="account"
                          value={acc.username}
                          checked={isSelected}
                          onChange={() => setSelectedUsername(acc.username)}
                          className="mt-1 text-amber-500 focus:ring-amber-500"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-white">
                            {acc.hotelName}
                          </div>
                          <div className="text-sm font-medium text-amber-400">
                            @{acc.username}
                          </div>
                          {acc.name && (
                            <div className="mt-0.5 text-xs text-white/50">
                              {acc.name}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedUsername}
                  className="mt-4 w-full rounded-xl bg-amber-500 px-5 py-3 font-medium text-[#0f0f0f] transition-colors hover:bg-amber-400 disabled:opacity-60"
                >
                  {loading ? "Continuing..." : "Continue to Reset Password"}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div>
            {!activeToken && !error && (
              <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                Invalid or missing password reset link.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-white/80"
                >
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/15 bg-[#0f0f0f] px-4 py-2.5 text-white transition-colors outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium text-white/80"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/15 bg-[#0f0f0f] px-4 py-2.5 text-white transition-colors outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !activeToken}
                className="w-full rounded-xl bg-amber-500 px-5 py-3 font-medium text-[#0f0f0f] transition-colors hover:bg-amber-400 disabled:opacity-60"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-white/60 transition-colors hover:text-amber-400"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
