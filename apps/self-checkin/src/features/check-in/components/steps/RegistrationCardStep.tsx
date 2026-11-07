import { formatDate } from "@hotelos/utils";
import type {
  BookingSummary,
  GuestSummary,
  StepData,
} from "../../types/checkIn.types";

interface RegistrationCardStepProps {
  booking: BookingSummary & {
    roomType?: string;
    roomNumber?: string;
    guests?: { adults?: number; children?: number };
  };
  guest: GuestSummary;
  stepData?: StepData;
}

export function RegistrationCardStep({
  booking,
  guest,
  stepData,
}: RegistrationCardStepProps) {
  const adults = booking.adults ?? booking.guests?.adults ?? 1;
  const children = booking.children ?? booking.guests?.children ?? 0;
  const roomDisplay =
    booking.roomId?.roomNumber || booking.roomNumber
      ? `Room ${booking.roomId?.roomNumber || booking.roomNumber}`
      : booking.roomId?.type || booking.roomType || "Standard";

  const rows = [
    ["Name", guest.name || "—"],
    ["Nationality", guest.nationality || "—"],
    ["Check-in", booking.checkIn ? formatDate(booking.checkIn) : "—"],
    ["Check-out", booking.checkOut ? formatDate(booking.checkOut) : "—"],
    ["Room", roomDisplay],
    ["Guests", `${adults} Adults, ${children} Children`],
  ];

  const docs = stepData?.documents || [];

  return (
    <div>
      <p className="text-brand-900 text-center text-lg font-semibold">
        Registration Card
      </p>
      <p className="text-surface-500 mt-1 text-center text-sm">
        Please review your details and confirm
      </p>

      <div className="border-surface-200 mx-auto mt-5 max-w-md rounded-xl border bg-white p-5 shadow-sm">
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

        {/* Identity Documents List */}
        {docs.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-3">
            <p className="text-surface-500 mb-2 text-[11px] font-bold tracking-wider uppercase">
              Identity Documents ({docs.length})
            </p>
            <div className="space-y-2">
              {docs.map((doc, idx) => (
                <div
                  key={
                    doc.idNumber
                      ? `${doc.idType}_${doc.idNumber}_${idx}`
                      : `doc_${idx}`
                  }
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-xs"
                >
                  <div>
                    <span className="text-brand-900 block font-bold">
                      {doc.idType}
                    </span>
                    <span className="font-mono text-[11px] text-gray-500">
                      {doc.idNumber || "—"}
                    </span>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    {doc.back ? "Front & Back" : "Front Side"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-surface-400 mt-4 text-[11px] leading-relaxed">
          I hereby confirm that the above information is correct and I agree to
          the hotel&apos;s terms and conditions for the duration of my stay.
        </p>
      </div>
    </div>
  );
}

export default RegistrationCardStep;
