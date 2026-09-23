import React from "react";

const statusBadges = {
  "checked-in": "bg-blue-100 text-blue-700",
  reserved: "bg-amber-100 text-amber-700",
  "checked-out": "bg-gray-100 text-gray-600",
};

export default function ReservationDetailsModal({
  open,
  onClose,
  reservation,
  onCheckIn,
  onCheckOut,
  onEdit,
}) {
  if (!open || !reservation) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-brand-900 text-lg font-bold">
              Reservation Details
            </h3>
            <p className="mt-0.5 font-mono text-xs text-gray-500">
              ID: {reservation.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 pt-4 text-sm">
          {/* Status banner */}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
            <div>
              <span className="text-xs text-gray-500">Status</span>
              <div className="mt-1">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                    statusBadges[reservation.status] ||
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {reservation.status}
                </span>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Booking Source</span>
              <div className="mt-1 font-semibold text-gray-800">
                {reservation.channel || "DIRECT"}
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Nights</span>
              <div className="mt-1 font-semibold text-gray-800">
                {reservation.nights ? `${reservation.nights}n` : "—"}
              </div>
            </div>
          </div>

          {/* Guest info */}
          <div className="rounded-xl border border-gray-100 p-4">
            <h4 className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
              Guest Details
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500">Name:</span>
                <p className="text-brand-900 font-semibold">
                  {reservation.name}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>
                <p className="text-brand-900 font-semibold">
                  {reservation.phone || "—"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="text-brand-900 font-semibold">
                  {reservation.email || "—"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">ID Verification:</span>
                <p className="text-brand-900 font-semibold">
                  {reservation.idType}
                  {reservation.idNumber ? ` (${reservation.idNumber})` : ""}
                </p>
              </div>
              {reservation.address && (
                <div className="col-span-2">
                  <span className="text-gray-500">Address:</span>
                  <p className="text-brand-900 font-semibold">
                    {reservation.address}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Room & Dates */}
          <div className="rounded-xl border border-gray-100 p-4">
            <h4 className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
              Stay & Room
            </h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-gray-500">Room:</span>
                <p className="text-brand-900 font-bold">
                  {reservation.roomNumber
                    ? `Room ${reservation.roomNumber}`
                    : "Unassigned"}
                </p>
                {reservation.roomType && (
                  <span className="text-gray-400">{reservation.roomType}</span>
                )}
              </div>
              <div>
                <span className="text-gray-500">Check In:</span>
                <p className="font-semibold text-gray-800">
                  {reservation.checkIn || "—"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Check Out:</span>
                <p className="font-semibold text-gray-800">
                  {reservation.checkOut || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Documents */}
          {reservation.documents?.length > 0 && (
            <div className="rounded-xl border border-gray-100 p-4">
              <h4 className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
                Uploaded ID Documents
              </h4>
              <div className="space-y-2">
                {reservation.documents.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs"
                  >
                    <span className="truncate text-gray-700">
                      📄 {doc.filename || `Document ${idx + 1}`}
                    </span>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 hover:text-blue-800"
                      >
                        View / Download
                      </a>
                    ) : (
                      <span className="text-gray-400">Stored</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            {reservation.status === "reserved" && (
              <button
                onClick={() => {
                  onCheckIn?.(reservation);
                  onClose();
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Check In Guest
              </button>
            )}
            {reservation.status === "checked-in" && (
              <button
                onClick={() => {
                  onCheckOut?.(reservation);
                  onClose();
                }}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
              >
                Check Out Guest
              </button>
            )}
            <button
              onClick={() => {
                onEdit?.(reservation);
                onClose();
              }}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Edit Stay
            </button>
            <button
              onClick={onClose}
              className="ml-auto rounded-xl px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
