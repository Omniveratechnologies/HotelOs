import { formatDate } from "@hotelos/utils";

/** Step 6 — Registration Card (read-only recap rendered like a paper form). */
export function RegistrationCardStep({ booking, guest, stepData }) {
  const rows = [
    ["Name", guest.name],
    ["Nationality", guest.nationality || "—"],
    ["ID Type", stepData?.idType || "—"],
    ["ID Number", stepData?.idNumber || "—"],
    ["Check-in", formatDate(booking.checkIn)],
    ["Check-out", formatDate(booking.checkOut)],
    [
      "Room",
      booking.roomNumber
        ? `Room ${booking.roomNumber}`
        : booking.roomType || "—",
    ],
    [
      "Guests",
      `${booking.guests?.adults ?? 1} Adults, ${booking.guests?.children ?? 0} Children`,
    ],
  ];

  return (
    <div>
      <p className="text-brand-900 text-center text-lg font-semibold">
        Registration Card
      </p>
      <p className="text-surface-500 mt-1 text-center text-sm">
        Please review your details and confirm
      </p>

      <div className="border-surface-200 mx-auto mt-5 max-w-md rounded-xl border bg-white p-5 shadow-2xs">
        <p className="text-brand-900 text-center text-xs font-semibold tracking-[0.2em] uppercase">
          Guest Registration Card
        </p>
        <dl className="mt-4 divide-y divide-gray-100 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2">
              <dt className="text-surface-500 w-2/5">{label}</dt>
              <dd className="text-brand-900 w-3/5 text-right font-medium">
                {value || "—"}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-surface-400 mt-4 text-[11px] leading-relaxed">
          I hereby confirm that the above information is correct and I agree to
          the hotel&apos;s terms and conditions for the duration of my stay.
        </p>
      </div>
    </div>
  );
}

export default RegistrationCardStep;
