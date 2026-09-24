import React, { useState } from "react";
import { Modal, Button, Input } from "@hotelos/ui/components";
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
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Reservation"
      subtitle={`Update room assignment, dates, or stay status for ${reservation.name}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="text-brand-900 mb-1.5 block text-xs font-semibold">
            Assigned Room
          </label>
          <select
            value={form.roomId}
            onChange={(e) => setField("roomId", e.target.value)}
            className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition outline-none focus:ring-2"
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
          <Input
            label="Check In"
            type="date"
            value={form.checkIn}
            onChange={(e) => setField("checkIn", e.target.value)}
          />
          <Input
            label="Check Out *"
            type="date"
            required
            value={form.checkOut}
            onChange={(e) => setField("checkOut", e.target.value)}
          />
        </div>

        <div>
          <label className="text-brand-900 mb-1.5 block text-xs font-semibold">
            Stay Status
          </label>
          <select
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
            className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition outline-none focus:ring-2"
          >
            <option value="reserved">Reserved (Upcoming)</option>
            <option value="checked-in">Checked In (Active)</option>
            <option value="checked-out">Checked Out (Completed)</option>
          </select>
        </div>

        <div className="flex gap-3 border-t border-gray-100 pt-4">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={updateReservationMut.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            loading={updateReservationMut.isPending}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
