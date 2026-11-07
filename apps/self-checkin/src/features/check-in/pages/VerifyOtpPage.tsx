import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Mail,
} from "lucide-react";
import { verifyOtp, lookupBooking } from "../api/checkInApi";

const OTP_SLOTS = [
  "otp-box-1",
  "otp-box-2",
  "otp-box-3",
  "otp-box-4",
  "otp-box-5",
  "otp-box-6",
];

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get("reservationId") || "";
  const maskedEmail = searchParams.get("maskedEmail") || "your email";

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    const char = val.replace(/[^0-9]/g, "").slice(-1);
    const updated = [...digits];
    updated[index] = char;
    setDigits(updated);
    setErrorMessage("");

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, 6);
    if (!pasted) return;

    const updated = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i] || "";
    }
    setDigits(updated);
    const nextIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const fullCode = digits.join("");

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (fullCode.length !== 6) {
      setErrorMessage("Please enter all 6 digits of your verification code");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await verifyOtp(reservationId, fullCode);
      if (response.token) {
        navigate(`/check-in/${response.token}`);
      } else {
        throw new Error("Invalid session token returned by server");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Invalid or expired verification code";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage("");
    setResendSuccess(false);

    try {
      await lookupBooking(reservationId);
      setResendCooldown(60);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend code";
      setErrorMessage(msg);
    } finally {
      setIsResending(false);
    }
  };

  // On-screen numeric keypad input for kiosks
  const handleKeypadPress = (num: string) => {
    const firstEmptyIndex = digits.findIndex((d) => !d);
    if (firstEmptyIndex !== -1) {
      handleDigitChange(firstEmptyIndex, num);
    }
  };

  const handleKeypadBackspace = () => {
    const lastFilledIndex = digits.findLastIndex((d) => Boolean(d));
    if (lastFilledIndex !== -1) {
      const updated = [...digits];
      updated[lastFilledIndex] = "";
      setDigits(updated);
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-slate-950 p-4 text-white sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950"
      />

      <header className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Security Verification</span>
        </div>
      </header>

      <main className="relative z-10 my-auto flex w-full justify-center py-6">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Mail size={24} />
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Enter Verification Code
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-slate-200">
                {maskedEmail}
              </span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="mt-8 space-y-6">
            {/* 6 Digit boxes */}
            <div
              className="flex justify-center gap-2 sm:gap-3"
              onPaste={handlePaste}
            >
              {OTP_SLOTS.map((slotId, idx) => (
                <input
                  key={slotId}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digits[idx] || ""}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="h-14 w-12 rounded-xl border border-white/15 bg-white/5 text-center text-2xl font-bold text-white transition outline-none focus:border-blue-500 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/20 sm:h-16 sm:w-14"
                />
              ))}
            </div>

            {errorMessage && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                <AlertCircle size={18} className="shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {resendSuccess && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-xs text-emerald-300">
                A fresh verification code has been dispatched to your email!
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || fullCode.length !== 6}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-base font-bold text-white shadow-lg transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <span>Verify &amp; Continue Check-In →</span>
              )}
            </button>

            {/* Resend button */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-slate-400 transition hover:text-white disabled:opacity-50"
              >
                <RefreshCw
                  size={12}
                  className={isResending ? "animate-spin" : ""}
                />
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Didn't receive code? Resend now"}
              </button>
            </div>
          </form>

          {/* On-screen Keypad for Touchscreens / Kiosks */}
          <div className="mt-6 border-t border-white/10 pt-6">
            <p className="mb-3 text-center text-xs text-slate-500">
              On-Screen Keypad
            </p>
            <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
              {[
                { label: "1", id: "k-1" },
                { label: "2", id: "k-2" },
                { label: "3", id: "k-3" },
                { label: "4", id: "k-4" },
                { label: "5", id: "k-5" },
                { label: "6", id: "k-6" },
                { label: "7", id: "k-7" },
                { label: "8", id: "k-8" },
                { label: "9", id: "k-9" },
                { label: "", id: "k-blank" },
                { label: "0", id: "k-0" },
                { label: "DEL", id: "k-del" },
              ].map((btn) => {
                if (btn.label === "") return <div key={btn.id} />;
                if (btn.label === "DEL") {
                  return (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={handleKeypadBackspace}
                      className="h-12 cursor-pointer rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-rose-300 transition active:bg-white/20"
                    >
                      Delete
                    </button>
                  );
                }
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => handleKeypadPress(btn.label)}
                    className="h-12 cursor-pointer rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-white transition active:bg-white/20"
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 text-center text-xs text-slate-500">
        <p>
          Your session will automatically expire after 10 minutes of inactivity.
        </p>
      </footer>
    </div>
  );
}
