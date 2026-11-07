import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Pencil,
  Calendar,
  User,
  ShieldCheck,
  Camera,
  PenTool,
  Sliders,
  BedDouble,
  X,
} from "lucide-react";
import { StatusChip } from "@hotelos/ui/components";
import type {
  BookingSummary,
  GuestSummary,
  StepData,
} from "../../types/checkIn.types";

interface SuccessStepProps {
  booking: BookingSummary;
  guest: GuestSummary;
  status?: string;
  stepData?: StepData | null;
  correctionMessage?: string | null;
  rejectionMessage?: string | null;
  onEditResponse?: () => void;
  submitting?: boolean;
}

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export function SuccessStep({
  booking,
  guest,
  status = "submitted",
  stepData,
  correctionMessage,
  rejectionMessage,
  onEditResponse,
  submitting = false,
}: SuccessStepProps) {
  const [zoomImage, setZoomImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const isApproved = status === "approved" || status === "checked-in";
  const isRejected = status === "rejected";
  const isCorrection = status === "correction-requested";

  const roomNumber = booking.roomNumber || booking.roomId?.roomNumber;
  const roomType = booking.roomType || booking.roomId?.type || "Standard Room";

  return (
    <div className="space-y-6">
      {/* 1. Header & Status Card */}
      <div className="border-surface-200 rounded-2xl border bg-white p-5 text-center shadow-xs sm:p-6">
        {isApproved ? (
          <>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-md">
              <CheckCircle2 size={32} className="text-white" />
            </span>
            <p className="text-brand-900 mt-4 text-xl font-bold">
              You&apos;re Checked In!
            </p>
            <p className="text-surface-500 mt-1.5 text-sm">
              Your details were verified and approved. Welcome to your stay!
            </p>
            {roomNumber && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
                <BedDouble size={18} /> Room #{roomNumber} ({roomType})
              </div>
            )}
          </>
        ) : isRejected ? (
          <>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 shadow-md">
              <XCircle size={32} className="text-white" />
            </span>
            <p className="text-brand-900 mt-4 text-xl font-bold">
              Check-in Submission Rejected
            </p>
            <p className="text-surface-600 mt-1.5 text-sm">
              {rejectionMessage ||
                "Reception was unable to verify your check-in. Please review your details and re-submit or contact the front desk."}
            </p>
            {onEditResponse && (
              <button
                type="button"
                onClick={onEditResponse}
                disabled={submitting}
                className="bg-brand-600 hover:bg-brand-700 mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-xs transition"
              >
                <Pencil size={14} /> Update &amp; Re-Submit
              </button>
            )}
          </>
        ) : isCorrection ? (
          <>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 shadow-md">
              <AlertTriangle size={32} className="text-white" />
            </span>
            <p className="text-brand-900 mt-4 text-xl font-bold">
              Reception Requested Changes
            </p>
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-left text-xs font-medium text-amber-900">
              <p className="font-bold text-amber-950">Note from Reception:</p>
              <p className="mt-0.5">
                {correctionMessage ||
                  "Please update your documents or details."}
              </p>
            </div>
            {onEditResponse && (
              <button
                type="button"
                onClick={onEditResponse}
                disabled={submitting}
                className="bg-brand-600 hover:bg-brand-700 mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-xs transition"
              >
                <Pencil size={14} /> Edit &amp; Re-Submit
              </button>
            )}
          </>
        ) : (
          /* Submitted - Pending Verification */
          <>
            <span className="bg-brand-600 mx-auto flex h-16 w-16 items-center justify-center rounded-full shadow-md">
              <Clock size={32} className="text-white" />
            </span>
            <p className="text-brand-900 mt-4 text-xl font-bold">
              Check-in Submitted Successfully!
            </p>
            <p className="text-surface-500 mx-auto mt-1.5 max-w-md text-sm leading-relaxed">
              Your registration details have been submitted for verification.
              Our reception team will review and confirm your check-in shortly.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <StatusChip variant="pending" dot>
                Pending Reception Review
              </StatusChip>
            </div>
            {onEditResponse && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={onEditResponse}
                  disabled={submitting}
                  className="border-surface-300 text-brand-900 hover:bg-background-100 inline-flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-4 py-2 text-xs font-semibold shadow-2xs transition"
                >
                  <Pencil size={13} /> Edit Submission
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 2. Unified All-Submitted-Data Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-brand-900 text-sm font-bold tracking-wide uppercase">
            Submitted Registration Details
          </p>
          {onEditResponse && !isApproved && (
            <button
              type="button"
              onClick={onEditResponse}
              className="text-brand-700 hover:text-brand-900 flex cursor-pointer items-center gap-1 text-xs font-bold transition"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>

        {/* Section: Stay / Booking Details */}
        <div className="border-surface-200 rounded-2xl border bg-white p-4 shadow-xs sm:p-5">
          <div className="border-surface-100 text-brand-900 flex items-center gap-2 border-b pb-3 text-xs font-bold tracking-wider uppercase">
            <Calendar size={14} className="text-brand-600" /> Stay Details
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div>
              <span className="text-surface-400 block text-[11px]">
                Booking No
              </span>
              <span className="text-brand-900 font-bold">
                {booking.reservationNo || "—"}
              </span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">
                Room Type
              </span>
              <span className="text-brand-900 font-semibold">{roomType}</span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">
                Check-In
              </span>
              <span className="text-brand-900 font-semibold">
                {formatDate(booking.checkIn)}
              </span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">
                Check-Out
              </span>
              <span className="text-brand-900 font-semibold">
                {formatDate(booking.checkOut)}
              </span>
            </div>
          </div>
          {booking.guests && (
            <div className="border-surface-50 text-surface-500 mt-3 border-t pt-2 text-[11px]">
              Occupancy: {booking.guests.adults || 1} Adult
              {booking.guests.adults !== 1 ? "s" : ""},{" "}
              {booking.guests.children || 0} Child
              {booking.guests.children !== 1 ? "ren" : ""}
              {booking.nights
                ? ` · ${booking.nights} Night${booking.nights !== 1 ? "s" : ""}`
                : ""}
            </div>
          )}
        </div>

        {/* Section: Primary Guest Information */}
        <div className="border-surface-200 rounded-2xl border bg-white p-4 shadow-xs sm:p-5">
          <div className="border-surface-100 text-brand-900 flex items-center gap-2 border-b pb-3 text-xs font-bold tracking-wider uppercase">
            <User size={14} className="text-brand-600" /> Guest Information
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <div>
              <span className="text-surface-400 block text-[11px]">
                Guest Name
              </span>
              <span className="text-brand-900 font-bold">
                {guest.name || stepData?.guestName || "—"}
              </span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">
                Phone Number
              </span>
              <span className="text-brand-900 font-semibold">
                {guest.phone || stepData?.phone || "—"}
              </span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">
                Email Address
              </span>
              <span className="text-brand-900 font-semibold">
                {guest.email || stepData?.email || "—"}
              </span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">
                Nationality
              </span>
              <span className="text-brand-900 font-semibold">
                {guest.nationality || stepData?.nationality || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Section: Identity Documents */}
        <div className="border-surface-200 rounded-2xl border bg-white p-4 shadow-xs sm:p-5">
          <div className="border-surface-100 text-brand-900 flex items-center gap-2 border-b pb-3 text-xs font-bold tracking-wider uppercase">
            <ShieldCheck size={14} className="text-brand-600" /> Identity
            Documents
          </div>
          {stepData?.documents && stepData.documents.length > 0 ? (
            <div className="mt-3 space-y-4">
              {stepData.documents.map((doc, idx) => (
                <div
                  key={doc.idNumber ? `${doc.idNumber}_${idx}` : idx}
                  className="border-surface-100 bg-surface-50/50 rounded-xl border p-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-900 font-bold">
                      Document #{idx + 1}: {doc.idType}
                    </span>
                    <span className="text-surface-600 font-mono text-[11px]">
                      No: {doc.idNumber || "—"}
                    </span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    {/* Front */}
                    <div>
                      <span className="text-surface-400 text-[10px] font-semibold uppercase">
                        Front Side
                      </span>
                      {doc.front?.url || doc.front?.previewUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setZoomImage({
                              url:
                                doc.front?.url || doc.front?.previewUrl || "",
                              title: `${doc.idType} - Front`,
                            })
                          }
                          className="mt-1 block w-full overflow-hidden rounded-lg border border-gray-200 bg-white"
                        >
                          <img
                            src={doc.front.url || doc.front.previewUrl}
                            alt="Document front"
                            className="h-24 w-full object-contain transition hover:scale-105"
                          />
                        </button>
                      ) : (
                        <div className="text-surface-400 mt-1 flex h-20 items-center justify-center rounded-lg border border-dashed border-gray-200 text-xs">
                          Not captured
                        </div>
                      )}
                    </div>

                    {/* Back */}
                    <div>
                      <span className="text-surface-400 text-[10px] font-semibold uppercase">
                        Back Side
                      </span>
                      {doc.back?.url || doc.back?.previewUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setZoomImage({
                              url: doc.back?.url || doc.back?.previewUrl || "",
                              title: `${doc.idType} - Back`,
                            })
                          }
                          className="mt-1 block w-full overflow-hidden rounded-lg border border-gray-200 bg-white"
                        >
                          <img
                            src={doc.back.url || doc.back.previewUrl}
                            alt="Document back"
                            className="h-24 w-full object-contain transition hover:scale-105"
                          />
                        </button>
                      ) : (
                        <div className="text-surface-400 mt-1 flex h-20 items-center justify-center rounded-lg border border-dashed border-gray-200 text-[11px]">
                          Optional (None)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-surface-400 mt-3 text-xs">
              No documents recorded.
            </p>
          )}
        </div>

        {/* Section: Guest Photo & Signature */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Selfie Photo */}
          <div className="border-surface-200 rounded-2xl border bg-white p-4 shadow-xs">
            <div className="border-surface-100 text-brand-900 flex items-center gap-2 border-b pb-3 text-xs font-bold tracking-wider uppercase">
              <Camera size={14} className="text-brand-600" /> Guest Photo
            </div>
            <div className="mt-3 flex justify-center">
              {stepData?.selfie?.url || stepData?.selfie?.previewUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    setZoomImage({
                      url:
                        stepData.selfie?.url ||
                        stepData.selfie?.previewUrl ||
                        "",
                      title: "Guest Photo",
                    })
                  }
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  <img
                    src={stepData.selfie.url || stepData.selfie.previewUrl}
                    alt="Guest photo"
                    className="h-32 w-28 object-cover transition hover:scale-105"
                  />
                </button>
              ) : (
                <div className="text-surface-400 flex h-32 w-28 items-center justify-center rounded-xl border border-dashed border-gray-200 text-xs">
                  No photo
                </div>
              )}
            </div>
          </div>

          {/* Signature & Agreement */}
          <div className="border-surface-200 rounded-2xl border bg-white p-4 shadow-xs">
            <div className="border-surface-100 text-brand-900 flex items-center gap-2 border-b pb-3 text-xs font-bold tracking-wider uppercase">
              <PenTool size={14} className="text-brand-600" /> Signature &amp;
              Terms
            </div>
            <div className="mt-3">
              {stepData?.signature?.url || stepData?.signature?.previewUrl ? (
                <div className="flex justify-center rounded-xl border border-gray-200 bg-white p-2">
                  <img
                    src={
                      stepData.signature.url || stepData.signature.previewUrl
                    }
                    alt="Guest signature"
                    className="h-16 max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="text-surface-400 flex h-16 items-center justify-center rounded-xl border border-dashed border-gray-200 text-xs">
                  Signed
                </div>
              )}
              {stepData?.termsAcceptedAt && (
                <p className="text-surface-500 mt-2 text-center text-[10px]">
                  Terms accepted on {formatDateTime(stepData.termsAcceptedAt)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section: Preferences & Remarks */}
        {((stepData?.preferences && stepData.preferences.length > 0) ||
          stepData?.remarks) && (
          <div className="border-surface-200 rounded-2xl border bg-white p-4 shadow-xs sm:p-5">
            <div className="border-surface-100 text-brand-900 flex items-center gap-2 border-b pb-3 text-xs font-bold tracking-wider uppercase">
              <Sliders size={14} className="text-brand-600" /> Preferences &amp;
              Remarks
            </div>
            {stepData.preferences && stepData.preferences.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {stepData.preferences.map((pref) => (
                  <span
                    key={pref}
                    className="bg-brand-50 text-brand-800 border-brand-100 rounded-lg border px-2.5 py-1 text-xs font-medium"
                  >
                    {pref}
                  </span>
                ))}
              </div>
            )}
            {stepData.remarks && (
              <p className="text-surface-600 mt-3 text-xs italic">
                &ldquo;{stepData.remarks}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>

      {/* 3. Image Zoom Modal */}
      {zoomImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
              <span className="text-brand-900 text-xs font-bold">
                {zoomImage.title}
              </span>
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center justify-center p-2">
              <img
                src={zoomImage.url}
                alt={zoomImage.title}
                className="max-h-[75vh] w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuccessStep;
