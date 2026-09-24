import { Modal, Button } from "@hotelos/ui/components";

const statusBadges = {
  "checked-in": "bg-emerald-50 text-emerald-700 border-emerald-200",
  reserved: "bg-amber-50 text-amber-700 border-amber-200",
  "checked-out": "bg-gray-100 text-gray-700 border-gray-200",
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
    <Modal
      open={open}
      onClose={onClose}
      title="Reservation Details"
      subtitle={`Reference ID: ${reservation.id}`}
    >
      <div className="space-y-6">
        {/* Status & Channel Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div>
            <span className="text-xs font-medium text-gray-500">Status</span>
            <div className="mt-1">
              <span
                className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${
                  statusBadges[reservation.status] ||
                  "bg-gray-100 text-gray-700"
                }`}
              >
                {reservation.status}
              </span>
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500">
              Booking Channel
            </span>
            <div className="mt-1 text-sm font-semibold text-gray-800">
              {reservation.channel || "DIRECT"}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500">
              Total Nights
            </span>
            <div className="mt-1 text-sm font-semibold text-gray-800">
              {reservation.nights ? `${reservation.nights} nights` : "—"}
            </div>
          </div>
        </div>

        {/* Guest Information */}
        <div className="rounded-xl border border-gray-100 p-4">
          <h4 className="text-brand-900 mb-3 text-sm font-semibold">
            Guest Information
          </h4>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-xs text-gray-500">Name</span>
              <p className="font-medium text-gray-800">{reservation.name}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Phone</span>
              <p className="font-medium text-gray-800">
                {reservation.phone || "—"}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Email</span>
              <p className="font-medium text-gray-800">
                {reservation.email || "—"}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">ID Verification</span>
              <p className="font-medium text-gray-800">
                {reservation.idType}
                {reservation.idNumber ? ` (${reservation.idNumber})` : ""}
              </p>
            </div>
            {reservation.address && (
              <div className="sm:col-span-2">
                <span className="text-xs text-gray-500">Address</span>
                <p className="font-medium text-gray-800">
                  {reservation.address}
                </p>
              </div>
            )}
            <div className="sm:col-span-2">
              <span className="text-xs text-gray-500">Purpose of Stay</span>
              <p className="font-medium text-gray-800">
                {reservation.purpose || "Not mentioned"}
              </p>
            </div>
          </div>
        </div>

        {/* Room & Dates */}
        <div className="rounded-xl border border-gray-100 p-4">
          <h4 className="text-brand-900 mb-3 text-sm font-semibold">
            Room & Schedule
          </h4>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <span className="text-xs text-gray-500">Room</span>
              <p className="text-brand-900 font-bold">
                {reservation.roomNumber
                  ? `Room ${reservation.roomNumber}`
                  : "Not assigned"}
              </p>
              {reservation.roomType && (
                <span className="text-xs text-gray-500">
                  {reservation.roomType}
                  {reservation.floor != null
                    ? ` (Floor ${reservation.floor})`
                    : ""}
                </span>
              )}
            </div>
            <div>
              <span className="text-xs text-gray-500">Check In</span>
              <p className="font-medium text-gray-800">
                {reservation.checkIn || "—"}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Check Out</span>
              <p className="font-medium text-gray-800">
                {reservation.checkOut || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Documents */}
        {reservation.documents?.length > 0 && (
          <div className="rounded-xl border border-gray-100 p-4">
            <h4 className="text-brand-900 mb-3 text-sm font-semibold">
              Identity Documents ({reservation.documents.length})
            </h4>
            <div className="space-y-2">
              {reservation.documents.map((doc, idx) => (
                <div
                  key={doc.id || idx}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs"
                >
                  <span className="truncate font-medium text-gray-700">
                    📄 {doc.filename || `Document ${idx + 1}`}
                    {doc.docType ? ` (${doc.docType})` : ""}
                  </span>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-600 font-semibold"
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

        {/* Footer actions */}
        <div className="flex flex-wrap justify-between gap-3 border-t border-gray-100 pt-4">
          <div className="flex gap-2">
            {reservation.status === "reserved" && (
              <Button
                variant="primary"
                onClick={() => {
                  onCheckIn?.(reservation);
                  onClose();
                }}
              >
                Check In Guest
              </Button>
            )}
            {reservation.status === "checked-in" && (
              <Button
                variant="danger"
                onClick={() => {
                  onCheckOut?.(reservation);
                  onClose();
                }}
              >
                Check Out Guest
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                onEdit?.(reservation);
                onClose();
              }}
            >
              Edit Stay
            </Button>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
