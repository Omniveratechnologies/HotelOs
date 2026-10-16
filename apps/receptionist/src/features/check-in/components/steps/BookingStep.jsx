import { Users, Calendar, BedDouble } from "lucide-react";
import { StatusChip } from "@hotelos/ui/components";
import { formatDate } from "@hotelos/utils";

/** Step 2 — Booking Details (read-only summary from the reservation). */
export function BookingStep({ booking, guest }) {
  const guestsLine = `${booking.guests?.adults ?? 1} Adult${booking.guests?.adults === 1 ? "" : "s"}${booking.guests?.children ? `, ${booking.guests.children} Child${booking.guests.children === 1 ? "" : "ren"}` : ""}`;

  return (
    <div>
      <p className="text-brand-900 text-center text-lg font-semibold">
        Your Booking Details
      </p>
      <p className="text-surface-500 mt-1 text-center text-sm">
        Please confirm your booking information
      </p>

      <div className="mt-5 space-y-4">
        <div className="bg-background-100 flex items-start justify-between rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="bg-brand-100 text-brand-700 flex h-12 w-12 items-center justify-center rounded-lg">
              <BedDouble size={22} />
            </span>
            <div>
              <p className="text-brand-900 text-sm font-semibold capitalize">
                {booking.roomType || "Room"}
              </p>
              <p className="text-surface-500 text-xs">
                {booking.roomNumber
                  ? `Room ${booking.roomNumber}`
                  : "Room assigned at check-in"}
              </p>
            </div>
          </div>
          <StatusChip variant="confirmed">Confirmed</StatusChip>
        </div>

        <dl className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-surface-500 flex items-center gap-2">
              <Calendar size={14} /> Dates
            </dt>
            <dd className="text-brand-900 font-medium">
              {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)} (
              {booking.nights} night{booking.nights === 1 ? "" : "s"})
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-surface-500 flex items-center gap-2">
              <Users size={14} /> Guests
            </dt>
            <dd className="text-brand-900 font-medium">{guestsLine}</dd>
          </div>
        </dl>

        <div className="bg-background-100 rounded-lg p-3 text-center">
          <p className="text-surface-500 text-xs">Booking No.</p>
          <p className="text-brand-900 text-sm font-bold tracking-wide">
            {booking.reservationNo}
          </p>
          <p className="text-surface-500 mt-1 text-xs">
            {guest.name} · {guest.phone}
          </p>
        </div>
      </div>
    </div>
  );
}

export default BookingStep;
