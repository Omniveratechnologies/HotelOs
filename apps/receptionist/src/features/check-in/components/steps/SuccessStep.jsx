import { CheckCircle2 } from "lucide-react";
import { StatusChip } from "@hotelos/ui/components";

/** Step 10 — Success: submitted for verification (status chip amber). */
export function SuccessStep({ booking, guest, approved = false }) {
  return (
    <div className="text-center">
      <span className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-emerald-500">
        <CheckCircle2 size={36} className="text-white" />
      </span>
      <p className="text-brand-900 mt-4 text-xl font-bold">
        {approved ? "You're checked in!" : "Check-in Submitted Successfully!"}
      </p>
      <p className="text-surface-500 mt-2 text-sm leading-relaxed">
        {approved
          ? "Your details were verified and approved by our reception team."
          : "Your details have been submitted for verification. Our reception team will review and confirm your check-in shortly."}
      </p>

      <div className="bg-background-100 mt-6 rounded-xl p-4 text-left">
        <div className="flex items-center justify-between py-1.5 text-sm">
          <span className="text-surface-500">Booking No.</span>
          <span className="text-brand-900 font-bold">
            {booking.reservationNo}
          </span>
        </div>
        <div className="flex items-center justify-between py-1.5 text-sm">
          <span className="text-surface-500">Guest Name</span>
          <span className="text-brand-900 font-medium">{guest.name}</span>
        </div>
        <div className="flex items-center justify-between py-1.5 text-sm">
          <span className="text-surface-500">Status</span>
          <StatusChip variant={approved ? "approved" : "pending"} dot>
            {approved ? "Approved" : "Pending Verification"}
          </StatusChip>
        </div>
      </div>

      {!approved && (
        <p className="text-surface-500 mt-4 text-xs">
          You will be notified once your check-in is approved.
        </p>
      )}
      <p className="text-surface-400 mt-2 text-xs">You can close this page.</p>
    </div>
  );
}

export default SuccessStep;
