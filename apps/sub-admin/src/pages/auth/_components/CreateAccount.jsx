import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { acceptInvitation } from "../../../services/invitation.service.js";

export default function CreateAccount({ token, invitation }) {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(invitation?.name || "");

  const [username, setUsername] = useState(invitation?.username || "");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // =====================================================
  // CREATE ACCOUNT
  // =====================================================

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("Invitation token is missing.");

      return;
    }

    if (!fullName.trim()) {
      setError("Full name is required.");

      return;
    }

    if (!username.trim()) {
      setError("Username is required.");

      return;
    }

    if (!password) {
      setError("Password is required.");

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

    setCreating(true);

    try {
      const data = await acceptInvitation({
        token,
        name: fullName.trim(),
        username: username.trim().toLowerCase(),
        password,
      });

      // =================================================
      // SAVE AUTHENTICATION
      // =================================================

      if (data?.token) {
        localStorage.setItem("auth_token", data.token);
      }

      if (data?.user) {
        localStorage.setItem("auth_user", JSON.stringify(data.user));
      }

      // =================================================
      // SUCCESS
      // =================================================

      setSuccess("Your account has been created successfully.");

      setTimeout(() => {
        navigate("/dashboard", {
          replace: true,
        });
      }, 1500);
    } catch (err) {
      console.error("Account creation failed:", err);

      setError(err.message || "Failed to create your account.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-beige-border bg-cream px-8 py-10 shadow-soft">
        {/* LOGO */}

        <Link to="/" className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 21V9l8-5 8 5v12"
                stroke="#F4F4E4"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />

              <path d="M9 21v-6h6v6" stroke="#766242" strokeWidth="1.6" />
            </svg>
          </span>

          <span className="font-display text-xl font-semibold text-navy">
            Hotel
            <span className="text-gold">OS</span>
          </span>
        </Link>

        {/* HEADING */}

        <h1 className="mb-1.5 font-display text-3xl font-semibold leading-tight text-navy">
          Welcome to HotelOS.
        </h1>

        <p className="mb-8 text-navy/60">Create your administrative account.</p>

        {/* HOTEL */}

        <div className="mb-6 rounded-lg border border-beige-border bg-ivory px-4 py-3">
          <p className="text-xs text-navy/60">Hotel</p>

          <p className="mt-1 font-medium text-navy">
            {invitation?.hotelName || "Hotel"}
          </p>

          <p className="mt-1 text-sm text-navy/60">{invitation?.email}</p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
            <br />
            Redirecting to your dashboard...
          </div>
        )}

        {/* FORM */}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* FULL NAME */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Full Name
            </label>

            <input
              type="text"
              required
              disabled={creating}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-beige-border bg-ivory px-4 py-2.5 text-navy outline-none transition-colors focus:border-gold disabled:opacity-70"
            />
          </div>

          {/* USERNAME */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Username
            </label>

            <input
              type="text"
              required
              disabled={creating}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-beige-border bg-ivory px-4 py-2.5 text-navy outline-none transition-colors focus:border-gold disabled:opacity-70"
            />
          </div>

          {/* EMAIL */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Email
            </label>

            <input
              type="email"
              disabled
              value={invitation?.email || ""}
              className="w-full rounded-lg border border-beige-border bg-ivory px-4 py-2.5 text-navy opacity-70"
            />
          </div>

          {/* PASSWORD */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Password
            </label>

            <input
              type="password"
              required
              disabled={creating}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-beige-border bg-ivory px-4 py-2.5 text-navy outline-none transition-colors focus:border-gold disabled:opacity-70"
            />
          </div>

          {/* CONFIRM PASSWORD */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Confirm Password
            </label>

            <input
              type="password"
              required
              disabled={creating}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-beige-border bg-ivory px-4 py-2.5 text-navy outline-none transition-colors focus:border-gold disabled:opacity-70"
            />
          </div>

          {/* BUTTON */}

          <button
            type="submit"
            disabled={creating || !!success}
            className="mt-2 w-full rounded-lg bg-navy px-5 py-3 font-medium text-cream transition-colors hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
