import { CheckCircle2, Lock } from "lucide-react";
import { formatDate } from "@hotelos/utils";
import type { BookingSummary, GuestSummary } from "../../types/checkIn.types";

export interface CheckItem {
  key: string;
  label: string;
  step: number;
  done: boolean;
}

export interface ReviewChecks {
  selfieDone?: string;
  selfieUrl?: string | null;
  items: CheckItem[];
}

interface ReviewStepProps {
  booking: BookingSummary;
  guest: GuestSummary;
  checks: ReviewChecks;
  onJump: (step: number) => void;
}

export function ReviewStep({
  booking,
  guest,
  checks,
  onJump,
}: ReviewStepProps) {
  return (
    <div>
      <p className="text-brand-900 text-center text-lg font-semibold">
        Review &amp; Submit
      </p>
      <p className="text-surface-500 mt-1 text-center text-sm">
        Please review all details before submitting
      </p>

      {/* Summary card */}
      <div className="bg-background-100 mt-5 flex items-center gap-3 rounded-xl p-4">
        {checks.selfieUrl ? (
          <img
            src={checks.selfieUrl}
            alt="Guest"
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <span className="bg-brand-100 text-brand-700 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold">
            {(guest.name || "G").charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-brand-900 text-sm font-semibold">
            {guest.name || "Guest"}
          </p>
          <p className="text-surface-500 text-xs">
            {guest.email || guest.phone || "—"}
          </p>
          <p className="text-surface-500 text-xs">
            {booking.checkIn ? formatDate(booking.checkIn) : "—"} –{" "}
            {booking.checkOut ? formatDate(booking.checkOut) : "—"}
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {checks.items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onJump(item.step)}
            className="border-surface-200 flex cursor-pointer items-center gap-2.5 rounded-lg border bg-white px-3 py-2.5 text-left transition hover:bg-gray-50"
          >
            <CheckCircle2
              size={18}
              className={
                item.done
                  ? "shrink-0 text-emerald-600"
                  : "text-surface-300 shrink-0"
              }
            />
            <span className="min-w-0">
              <span className="text-brand-900 block text-sm font-medium">
                {item.label}
              </span>
              <span
                className={`text-xs ${item.done ? "text-emerald-600" : "text-surface-500"}`}
              >
                {item.done ? "Completed" : "Tap to complete"}
              </span>
            </span>
          </button>
        ))}
      </div>

      <p className="text-surface-400 mt-5 flex items-center justify-center gap-1.5 text-[11px]">
        <Lock size={11} /> Secure · Powered by HotelOS
      </p>
    </div>
  );
}

export default ReviewStep;
