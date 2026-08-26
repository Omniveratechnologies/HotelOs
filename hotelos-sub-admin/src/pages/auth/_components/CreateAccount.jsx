import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  acceptInvitation,
} from "../../../services/invitation.service.js";

export default function CreateAccount({
  token,
  invitation,
}) {
  const navigate =
    useNavigate();

  const [fullName, setFullName] =
    useState(
      invitation?.name || ""
    );

  const [username, setUsername] =
    useState(
      invitation?.username || ""
    );

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =====================================================
  // CREATE ACCOUNT
  // =====================================================

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError(
        "Invitation token is missing."
      );

      return;
    }

    if (!fullName.trim()) {
      setError(
        "Full name is required."
      );

      return;
    }

    if (!username.trim()) {
      setError(
        "Username is required."
      );

      return;
    }

    if (!password) {
      setError(
        "Password is required."
      );

      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    setCreating(true);

    try {
      const data =
        await acceptInvitation({
          token,
          name: fullName.trim(),
          username:
            username
              .trim()
              .toLowerCase(),
          password,
        });

      // =================================================
      // SAVE AUTHENTICATION
      // =================================================

      if (data?.token) {
        localStorage.setItem(
          "auth_token",
          data.token
        );
      }

      if (data?.user) {
        localStorage.setItem(
          "auth_user",
          JSON.stringify(
            data.user
          )
        );
      }

      // =================================================
      // SUCCESS
      // =================================================

      setSuccess(
        "Your account has been created successfully."
      );

      setTimeout(() => {
        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );
      }, 1500);
    } catch (err) {
      console.error(
        "Account creation failed:",
        err
      );

      setError(
        err.message ||
          "Failed to create your account."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md bg-cream border border-beige-border rounded-2xl shadow-soft px-8 py-10">

        {/* LOGO */}

        <Link
          to="/"
          className="flex items-center gap-2.5 mb-8"
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
              />
            </svg>
          </span>

          <span className="font-display text-xl font-semibold text-navy">
            Hotel
            <span className="text-gold">
              OS
            </span>
          </span>
        </Link>

        {/* HEADING */}

        <h1 className="font-display text-3xl font-semibold text-navy mb-1.5 leading-tight">
          Welcome to HotelOS.
        </h1>

        <p className="text-navy/60 mb-8">
          Create your administrative account.
        </p>

        {/* HOTEL */}

        <div className="mb-6 rounded-lg bg-ivory border border-beige-border px-4 py-3">
          <p className="text-xs text-navy/60">
            Hotel
          </p>

          <p className="mt-1 font-medium text-navy">
            {invitation?.hotelName ||
              "Hotel"}
          </p>

          <p className="mt-1 text-sm text-navy/60">
            {invitation?.email}
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {success}

            <br />

            Redirecting to your dashboard...
          </div>
        )}

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* FULL NAME */}

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Full Name
            </label>

            <input
              type="text"
              required
              disabled={creating}
              value={fullName}
              onChange={(e) =>
                setFullName(
                  e.target.value
                )
              }
              className="w-full bg-ivory border border-beige-border rounded-lg px-4 py-2.5 text-navy outline-none focus:border-gold transition-colors disabled:opacity-70"
            />
          </div>

          {/* USERNAME */}

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Username
            </label>

            <input
              type="text"
              required
              disabled={creating}
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value
                )
              }
              className="w-full bg-ivory border border-beige-border rounded-lg px-4 py-2.5 text-navy outline-none focus:border-gold transition-colors disabled:opacity-70"
            />
          </div>

          {/* EMAIL */}

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Email
            </label>

            <input
              type="email"
              disabled
              value={
                invitation?.email || ""
              }
              className="w-full bg-ivory border border-beige-border rounded-lg px-4 py-2.5 text-navy opacity-70"
            />
          </div>

          {/* PASSWORD */}

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Password
            </label>

            <input
              type="password"
              required
              disabled={creating}
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="••••••••"
              className="w-full bg-ivory border border-beige-border rounded-lg px-4 py-2.5 text-navy outline-none focus:border-gold transition-colors disabled:opacity-70"
            />
          </div>

          {/* CONFIRM PASSWORD */}

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Confirm Password
            </label>

            <input
              type="password"
              required
              disabled={creating}
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              placeholder="••••••••"
              className="w-full bg-ivory border border-beige-border rounded-lg px-4 py-2.5 text-navy outline-none focus:border-gold transition-colors disabled:opacity-70"
            />
          </div>

          {/* BUTTON */}

          <button
            type="submit"
            disabled={
              creating ||
              !!success
            }
            className="w-full bg-navy text-cream font-medium rounded-lg px-5 py-3 hover:bg-navy-dark transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creating
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}