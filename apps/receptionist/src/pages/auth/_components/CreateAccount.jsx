import { useState } from "react";
import { useNavigate } from "react-router";
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

      if (data?.token) {
        localStorage.setItem("auth_token", data.token);
      }

      if (data?.user) {
        localStorage.setItem("auth_user", JSON.stringify(data.user));
      }

      setSuccess("Your account has been created successfully.");

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1500);
    } catch (err) {
      console.error("Account creation failed:", err);
      setError(err.message || "Failed to create your account.");
    } finally {
      setCreating(false);
    }
  }

  const inputClass =
    "w-full bg-cream-50 border border-navy-900/15 rounded-lg px-4 py-2.5 text-navy-900 outline-none focus:border-gold-400 transition-colors disabled:opacity-70";

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-navy-900/10 bg-white px-8 py-10 shadow-lg">
        {/* LOGO */}
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f1f3d]">
            <svg viewBox="0 0 24 24" fill="#c9a84c" className="h-4 w-4">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </span>
          <span className="font-display text-xl font-semibold tracking-wide text-navy-900">
            Hotel<span className="text-gold-400">OS</span>
          </span>
        </div>

        {/* HEADING */}
        <h1 className="mb-1.5 font-display text-3xl font-semibold leading-tight text-navy-900">
          Welcome to HotelOS.
        </h1>
        <p className="mb-8 text-navy-900/60">
          Set up your receptionist account.
        </p>

        {/* HOTEL */}
        <div className="mb-6 rounded-lg border border-navy-900/10 bg-cream-100 px-4 py-3">
          <p className="text-xs text-navy-900/60">Hotel</p>
          <p className="mt-1 font-medium text-navy-900">
            {invitation?.hotelName || "Hotel"}
          </p>
          <p className="mt-1 text-sm text-navy-900/60">{invitation?.email}</p>
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
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Full Name
            </label>
            <input
              type="text"
              required
              disabled={creating}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* USERNAME */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Username
            </label>
            <input
              type="text"
              required
              disabled={creating}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Email
            </label>
            <input
              type="email"
              disabled
              value={invitation?.email || ""}
              className={`${inputClass} opacity-70`}
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Password
            </label>
            <input
              type="password"
              required
              disabled={creating}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Confirm Password
            </label>
            <input
              type="password"
              required
              disabled={creating}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={creating || !!success}
            className="mt-2 w-full rounded-xl bg-navy-900 px-5 py-3 font-medium text-cream-50 transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
