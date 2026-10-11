import { useState } from "react";
import { useNavigate } from "react-router";
import { Input } from "@hotelos/ui/components";
import { acceptInvitation } from "@hotelos/api";

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

  return (
    <div className="bg-background-50 flex min-h-screen items-center justify-center px-6 py-16">
      <div className="border-brand-900/10 w-full max-w-md rounded-2xl border bg-white px-8 py-10 shadow-lg">
        {/* LOGO */}
        <div className="mb-8 flex items-center gap-2.5">
          <span className="bg-brand-900 flex h-9 w-9 items-center justify-center rounded-full">
            <svg
              viewBox="0 0 24 24"
              fill="var(--color-primary-400)"
              className="h-4 w-4"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </span>
          <span className="font-display text-brand-900 text-xl font-semibold tracking-wide">
            Hotel<span className="text-primary-400">OS</span>
          </span>
        </div>

        {/* HEADING */}
        <h1 className="font-display text-brand-900 mb-1.5 text-3xl leading-tight font-semibold">
          Welcome to HotelOS.
        </h1>
        <p className="text-brand-900/60 mb-8">
          Set up your receptionist account.
        </p>

        {/* HOTEL */}
        <div className="border-brand-900/10 bg-background-100 mb-6 rounded-lg border px-4 py-3">
          <p className="text-brand-900/60 text-xs">Hotel</p>
          <p className="text-brand-900 mt-1 font-medium">
            {invitation?.hotelName || "Hotel"}
          </p>
          <p className="text-brand-900/60 mt-1 text-sm">{invitation?.email}</p>
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
          <Input
            label="Full Name"
            type="text"
            required
            disabled={creating}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          {/* USERNAME */}
          <Input
            label="Username"
            type="text"
            required
            disabled={creating}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* EMAIL */}
          <Input
            label="Email"
            type="email"
            disabled
            value={invitation?.email || ""}
          />

          {/* PASSWORD */}
          <Input
            label="Password"
            type="password"
            required
            disabled={creating}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {/* CONFIRM PASSWORD */}
          <Input
            label="Confirm Password"
            type="password"
            required
            disabled={creating}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />

          {/* BUTTON */}
          <button
            type="submit"
            disabled={creating || !!success}
            className="bg-brand-900 text-background-50 hover:bg-brand-800 mt-2 w-full rounded-xl px-5 py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
