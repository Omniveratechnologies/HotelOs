import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

import { Input } from "@hotelos/ui/components";
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

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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
      setError("This password reset link is invalid or missing.");
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

    setLoading(true);

    try {
      await resetPassword({ token: activeToken, password });

      setSuccess(
        "Your password has been reset successfully. Redirecting to login...",
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      console.error("Reset password error:", err);

      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showAccountSelection = Boolean(selectionToken && !activeToken);

  return (
    <div className="bg-background-50 flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white px-8 py-10 shadow-lg">
        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center gap-2.5">
          <span className="bg-brand-900 flex h-9 w-9 items-center justify-center rounded-full">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 21V9l8-5 8 5v12"
                stroke="var(--color-surface-50)"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />

              <path
                d="M9 21v-6h6v6"
                stroke="var(--color-primary-400)"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <span className="font-display text-brand-900 text-xl font-semibold">
            Hotel<span className="text-primary-400">OS</span>
          </span>
        </Link>

        {/* Heading */}
        <h1 className="font-display text-brand-900 mb-1 text-3xl font-semibold">
          {showAccountSelection ? "Select Account" : "Reset Password"}
        </h1>

        <p className="text-brand-900/60 mb-8">
          {showAccountSelection
            ? "Choose which account you would like to reset password for:"
            : selectedAccountName
              ? `Create a new password for account @${selectedAccountName}.`
              : "Create a new password for your HotelOS account."}
        </p>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
            {success}
          </div>
        )}

        {showAccountSelection ? (
          <div>
            {accountsLoading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Loading accounts...
              </div>
            ) : accounts.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">
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
                            ? "border-brand-900 bg-brand-900/5 shadow-xs"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="account"
                          value={acc.username}
                          checked={isSelected}
                          onChange={() => setSelectedUsername(acc.username)}
                          className="text-brand-900 focus:ring-brand-900 mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {acc.hotelName}
                          </div>
                          <div className="text-sm font-medium text-gray-600">
                            @{acc.username}
                          </div>
                          {acc.name && (
                            <div className="mt-0.5 text-xs text-gray-400">
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
                  className="bg-brand-900 hover:bg-brand-800 mt-4 w-full rounded-lg px-5 py-3 font-medium text-white transition-colors disabled:opacity-60"
                >
                  {loading ? "Continuing..." : "Continue to Reset Password"}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div>
            {!activeToken && !error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                This password reset link is invalid or missing.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New password */}
              <Input
                id="password"
                name="password"
                label="New Password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
              />

              {/* Confirm password */}
              <Input
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !activeToken}
                className="bg-brand-900 hover:bg-brand-800 w-full rounded-lg px-5 py-3 font-medium text-white transition-colors disabled:opacity-60"
              >
                {loading ? "Resetting Password..." : "Reset Password"}
              </button>
            </form>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-brand-900/70 hover:text-primary-500 text-sm transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
