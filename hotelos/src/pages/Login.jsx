import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [recoveryMode, setRecoveryMode] = useState(null);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");

  const navigate = useNavigate();

  // =====================================================
  // LOGIN
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Invalid credentials"
        );
      }

      // Save authentication token
      localStorage.setItem(
        "hotelOS_token",
        result.data.token
      );

      // Save logged-in user
      localStorage.setItem(
        "hotelOS_user",
        JSON.stringify(result.data.user)
      );

      setSuccess("Login successful. Redirecting...");

      // Redirect to Sub Admin dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);

    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message || "Unable to login"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FORGOT USERNAME / PASSWORD
  // =====================================================

  const handleRecovery = async (e) => {
    e.preventDefault();

    if (!recoveryEmail.trim()) {
      setRecoveryMessage(
        "Please enter your email address."
      );
      return;
    }

    setRecoveryLoading(true);
    setRecoveryMessage("");

    try {
      const endpoint =
        recoveryMode === "username"
          ? "/api/v1/auth/forgot-username"
          : "/api/v1/auth/forgot-password";

      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: recoveryEmail.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to process your request."
        );
      }

      setRecoveryMessage(
        result.message ||
          "Please check your email."
      );

    } catch (err) {
      console.error(
        "Recovery error:",
        err
      );

      setRecoveryMessage(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  // =====================================================
  // CLOSE RECOVERY
  // =====================================================

  const closeRecovery = () => {
    setRecoveryMode(null);
    setRecoveryEmail("");
    setRecoveryMessage("");
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-6 relative">

      {/* Logo */}
      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center gap-2.5"
      >
        <span className="w-9 h-9 rounded-full bg-navy flex items-center justify-center">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M4 21V9l8-5 8 5v12"
              stroke="#F4F4E4"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M9 21v-6h6v6"
              stroke="#766242"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <span className="font-display text-xl font-semibold text-navy">
          Hotel<span className="text-gold">OS</span>
        </span>
      </Link>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-cream border border-beige-border rounded-2xl shadow-soft px-8 py-10">

        <h1 className="font-display text-3xl font-semibold text-navy mb-1">
          Hello Admin.
        </h1>

        <p className="text-navy/60 mb-8">
          Welcome back.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-navy mb-1.5"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="your.username"
              className="w-full bg-ivory border border-beige-border rounded-lg px-4 py-2.5 text-navy placeholder:text-muted outline-none focus:border-gold transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-navy mb-1.5"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
              className="w-full bg-ivory border border-beige-border rounded-lg px-4 py-2.5 text-navy placeholder:text-muted outline-none focus:border-gold transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
              {success}
            </div>
          )}

          {/* Login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-cream font-medium rounded-lg px-5 py-3 hover:bg-navy-dark transition-colors mt-2 disabled:opacity-60"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

          {/* Recovery links */}
          <div className="flex items-center justify-between pt-1 text-sm">

            <button
              type="button"
              onClick={() => {
                setRecoveryMode("username");
                setRecoveryMessage("");
                setError("");
              }}
              className="text-navy/70 hover:text-gold transition-colors"
            >
              Forgot username?
            </button>

            <button
              type="button"
              onClick={() => {
                setRecoveryMode("password");
                setRecoveryMessage("");
                setError("");
              }}
              className="text-navy/70 hover:text-gold transition-colors"
            >
              Forgot password?
            </button>

          </div>

        </form>
      </div>

      {/* =====================================================
          RECOVERY MODAL
          ===================================================== */}

      {recoveryMode && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50">

          <div className="w-full max-w-md bg-cream rounded-2xl shadow-soft border border-beige-border p-7">

            {/* Header */}
            <div className="flex items-start justify-between mb-6">

              <div>
                <h2 className="font-display text-2xl font-semibold text-navy">
                  {recoveryMode === "username"
                    ? "Forgot username?"
                    : "Forgot password?"}
                </h2>

                <p className="text-sm text-navy/60 mt-1">
                  {recoveryMode === "username"
                    ? "Enter your registered email and we'll send your username."
                    : "Enter your registered email and we'll send you a password reset link."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeRecovery}
                className="text-navy/50 hover:text-navy text-xl"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleRecovery}
              className="space-y-5"
            >

              <div>
                <label
                  htmlFor="recoveryEmail"
                  className="block text-sm font-medium text-navy mb-1.5"
                >
                  Registered Email
                </label>

                <input
                  id="recoveryEmail"
                  type="email"
                  required
                  autoFocus
                  value={recoveryEmail}
                  onChange={(e) =>
                    setRecoveryEmail(
                      e.target.value
                    )
                  }
                  placeholder="you@hotel.com"
                  className="w-full bg-ivory border border-beige-border rounded-lg px-4 py-2.5 text-navy placeholder:text-muted outline-none focus:border-gold transition-colors"
                />
              </div>

              {/* Recovery message */}
              {recoveryMessage && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
                  {recoveryMessage}
                </div>
              )}

              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  onClick={closeRecovery}
                  className="px-5 py-2.5 rounded-lg border border-beige-border text-navy hover:bg-ivory transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="px-5 py-2.5 rounded-lg bg-navy text-cream hover:bg-navy-dark transition-colors disabled:opacity-60"
                >
                  {recoveryLoading
                    ? "Sending..."
                    : recoveryMode === "username"
                    ? "Send Username"
                    : "Send Reset Link"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}