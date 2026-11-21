import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Input } from "@hotelos/ui/components";
import { authApi } from "@hotelos/api";

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

      authApi
        .getResetPasswordAccounts(selectionToken)
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
      const res = await authApi.selectResetPasswordAccount({
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

      await authApi.resetPassword({ token: activeToken, password });

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
    <div className="bg-background-50 flex min-h-screen items-center justify-center px-6">
      <div className="border-surface-200 w-full max-w-sm rounded-2xl border bg-white px-8 py-10 shadow-lg">
        <Link to="/login" className="mb-8 flex items-center gap-2.5">
          <span className="bg-primary-500 text-brand-950 flex h-9 w-9 items-center justify-center rounded-xl">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 21V9l8-5 8 5v12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M9 21v-6h6v6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <span className="font-display text-brand-900 text-xl font-bold">
            Hotel<span className="text-primary-600">OS</span>
          </span>
        </Link>

        <h1 className="font-display text-brand-900 mb-1 text-2xl font-bold">
          {showAccountSelection ? "Select Account" : "Reset Password"}
        </h1>

        <p className="text-brand-700/60 mb-8 text-sm">
          {showAccountSelection
            ? "Choose which account you would like to reset password for:"
            : selectedAccountName
              ? `Create a new password for account @${selectedAccountName}.`
              : "Create a new password for your Super Admin account."}
        </p>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
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
                Invalid or missing password reset link.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="password"
                label="New Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />

              <Input
                id="confirmPassword"
                label="Confirm New Password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />

              <button
                type="submit"
                disabled={loading || !activeToken}
                className="bg-brand-900 hover:bg-brand-800 w-full rounded-lg px-5 py-3 font-semibold text-white shadow-xs transition-colors disabled:opacity-60"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-brand-700/70 hover:text-brand-900 text-sm font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
