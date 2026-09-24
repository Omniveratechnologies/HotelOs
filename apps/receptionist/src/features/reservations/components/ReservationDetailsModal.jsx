import React from "react";
import { Modal, Button } from "@hotelos/ui/components";

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
    <Modal
      open={open}
      onClose={onClose}
      title="Reservation Details"
      subtitle={`ID: ${reservation.id}`}
      maxWidth="lg"
    >
      <div className="space-y-5 text-sm">
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
              <p className="text-brand-900 font-semibold">{reservation.name}</p>
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
            <Button
              size="sm"
              onClick={() => {
                onCheckIn?.(reservation);
                onClose();
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Check In Guest
            </Button>
          )}
          {reservation.status === "checked-in" && (
            <Button
              size="sm"
              onClick={() => {
                onCheckOut?.(reservation);
                onClose();
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Check Out Guest
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onEdit?.(reservation);
              onClose();
            }}
          >
            Edit Stay
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="ml-auto text-gray-500"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
