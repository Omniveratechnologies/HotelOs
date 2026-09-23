import React, { useState } from "react";
import { useRooms } from "../../rooms/hooks/useRooms.js";
import { useUpdateReservation } from "../hooks/useReservations.js";

export default function EditReservationModal({
  open,
  onClose,
  reservation,
  onSaved,
}) {
  const { rooms = [] } = useRooms();
  const updateReservationMut = useUpdateReservation();

  const [prevId, setPrevId] = useState(reservation?.id);
  const [form, setForm] = useState(() => ({
    roomId: reservation?.roomId || "",
    checkIn: reservation?.checkIn || "",
    checkOut: reservation?.checkOut || "",
    status: reservation?.status || "reserved",
  }));
  const [error, setError] = useState("");

  if (reservation?.id !== prevId) {
    setPrevId(reservation?.id);
    setForm({
      roomId: reservation?.roomId || "",
      checkIn: reservation?.checkIn || "",
      checkOut: reservation?.checkOut || "",
      status: reservation?.status || "reserved",
    });
    setError("");
  }

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectableRooms = rooms.filter(
    (r) =>
      r.channelVerified !== false &&
      (r.id === reservation?.roomId ||
        ["available", "cleaning"].includes(r.status)),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reservation) return;
    setError("");

    if (!form.checkOut) {
      return setError("Check-out date is required.");
    }
    if (form.checkIn && new Date(form.checkOut) <= new Date(form.checkIn)) {
      return setError("Check-out must be after check-in date.");
    }

    try {
      const updates = {
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        status: form.status,
      };
      if (form.roomId && form.roomId !== reservation.roomId) {
        updates.roomId = form.roomId;
      }

      await updateReservationMut.mutateAsync({
        id: reservation.id,
        updates,
      });

      onSaved?.();
      onClose();
    } catch (err) {
      console.error("Update reservation error:", err);
      setError(err.message || "Failed to update reservation.");
    }
  };

  if (!open || !reservation) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-brand-900 text-lg font-bold">
              Edit Reservation
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Update room assignment, dates, or stay status for{" "}
              {reservation.name}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="text-brand-900 block text-xs font-semibold">
              Assigned Room
            </label>
            <select
              value={form.roomId}
              onChange={(e) => setField("roomId", e.target.value)}
              className="focus:border-brand-900 mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-hidden"
            >
              <option value="">Select a room...</option>
              {selectableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} ({r.type} - ₹{r.rate || 0}/night)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-brand-900 block text-xs font-semibold">
                Check In
              </label>
              <input
                type="date"
                value={form.checkIn}
                onChange={(e) => setField("checkIn", e.target.value)}
                className="focus:border-brand-900 mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-brand-900 block text-xs font-semibold">
                Check Out *
              </label>
              <input
                type="date"
                required
                value={form.checkOut}
                onChange={(e) => setField("checkOut", e.target.value)}
                className="focus:border-brand-900 mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-brand-900 block text-xs font-semibold">
              Stay Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              className="focus:border-brand-900 mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-hidden"
            >
              <option value="reserved">Reserved (Upcoming)</option>
              <option value="checked-in">Checked In (Active)</option>
              <option value="checked-out">Checked Out (Completed)</option>
            </select>
          </div>

          <div className="flex gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={updateReservationMut.isPending}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateReservationMut.isPending}
              className="bg-brand-900 hover:bg-brand-800 flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {updateReservationMut.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
