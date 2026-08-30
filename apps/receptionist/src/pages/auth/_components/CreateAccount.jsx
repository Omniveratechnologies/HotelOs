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
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md bg-white border border-navy-900/10 rounded-2xl shadow-lg px-8 py-10">
        {/* LOGO */}
        <div className="flex items-center gap-2.5 mb-8">
          <span className="w-9 h-9 rounded-full bg-[#0f1f3d] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="#c9a84c" className="w-4 h-4">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
          </span>
          <span className="font-display text-xl font-semibold text-navy-900 tracking-wide">
            Hotel<span className="text-gold-400">OS</span>
          </span>
        </div>

        {/* HEADING */}
        <h1 className="font-display text-3xl font-semibold text-navy-900 mb-1.5 leading-tight">
          Welcome to HotelOS.
        </h1>
        <p className="text-navy-900/60 mb-8">
          Set up your receptionist account.
        </p>

        {/* HOTEL */}
        <div className="mb-6 rounded-lg bg-cream-100 border border-navy-900/10 px-4 py-3">
          <p className="text-xs text-navy-900/60">Hotel</p>
          <p className="mt-1 font-medium text-navy-900">
            {invitation?.hotelName || "Hotel"}
          </p>
          <p className="mt-1 text-sm text-navy-900/60">{invitation?.email}</p>
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
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* FULL NAME */}
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1.5">Full Name</label>
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
            <label className="block text-sm font-medium text-navy-900 mb-1.5">Username</label>
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
            <label className="block text-sm font-medium text-navy-900 mb-1.5">Email</label>
            <input
              type="email"
              disabled
              value={invitation?.email || ""}
              className={`${inputClass} opacity-70`}
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1.5">Password</label>
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
            <label className="block text-sm font-medium text-navy-900 mb-1.5">Confirm Password</label>
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
            className="w-full bg-navy-900 text-cream-50 font-medium rounded-xl px-5 py-3 hover:bg-navy-800 transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creating ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
