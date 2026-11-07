import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Loader2,
  AlertCircle,
  Building2,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { lookupBooking } from "../api/checkInApi";

export default function KioskLandingPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage(
        "Please enter your Booking ID or registered Email address",
      );
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await lookupBooking(identifier.trim());
      navigate(
        `/verify-otp?reservationId=${encodeURIComponent(response.reservationId)}&maskedEmail=${encodeURIComponent(response.maskedEmail)}`,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not find your reservation. Please check your details or visit reception.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-slate-950 p-4 text-white sm:p-8">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950"
      />

      {/* Header bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">HotelOS</h1>
            <p className="text-xs text-slate-400">Guest Express Terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Encrypted Session</span>
        </div>
      </header>

      {/* Main card */}
      <main className="relative z-10 my-auto flex w-full justify-center py-6">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="text-center">
            <span className="inline-block rounded-full bg-blue-500/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-blue-400 uppercase">
              Contactless Express Check-In
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Welcome to Your Stay
            </h2>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">
              Skip the front desk queue. Enter your booking details to start
              check-in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="identifier"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Booking ID or Email Address
              </label>
              <div className="relative">
                <input
                  id="identifier"
                  type="text"
                  autoComplete="off"
                  disabled={isLoading}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  placeholder="e.g. RES-2026-0001 or name@example.com"
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-4 pl-12 text-base text-white placeholder-slate-500 transition outline-none focus:border-blue-500 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/20"
                />
                <Search
                  size={20}
                  className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                <AlertCircle size={18} className="shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-base font-bold text-white shadow-lg transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Searching Reservation...</span>
                </>
              ) : (
                <>
                  <span>Find My Reservation</span>
                  <span className="text-xl">→</span>
                </>
              )}
            </button>
          </form>

          {/* Helper notes */}
          <div className="mt-8 border-t border-white/10 pt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Smartphone size={14} className="text-slate-500" />
              <span>
                We&apos;ll send a quick 6-digit verification code to your email
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-500">
        <p>
          Need immediate assistance? Please approach the front desk or call
          reception.
        </p>
      </footer>
    </div>
  );
}
