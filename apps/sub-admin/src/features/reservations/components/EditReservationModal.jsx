import { useState } from "react";
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
    purpose: reservation?.purpose || "",
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
      return setError("Check-out date must be after check-in date.");
    }

    try {
      const updates = {
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        status: form.status,
        purpose: form.purpose,
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
      subtitle={`Guest: ${reservation.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label
            htmlFor="edit-res-room"
            className="text-brand-900 mb-2 block text-sm font-medium"
          >
            Assigned Room
          </label>
          <select
            id="edit-res-room"
            value={form.roomId}
            onChange={(e) => setField("roomId", e.target.value)}
            className="text-brand-900 focus:ring-primary-400 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-hidden focus:ring-2"
          >
            <option value="">Select a room...</option>
            {selectableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.roomNumber} ({r.type} - ₹{r.rate || 0}/night)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Check-In Date"
            name="checkIn"
            type="date"
            value={form.checkIn}
            onChange={(e) => setField("checkIn", e.target.value)}
          />
          <Input
            label="Check-Out Date"
            name="checkOut"
            type="date"
            value={form.checkOut}
            onChange={(e) => setField("checkOut", e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="edit-res-status"
            className="text-brand-900 mb-2 block text-sm font-medium"
          >
            Stay Status
          </label>
          <select
            id="edit-res-status"
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
            className="text-brand-900 focus:ring-primary-400 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-hidden focus:ring-2"
          >
            <option value="reserved">Reserved (Upcoming)</option>
            <option value="checked-in">Checked In (Active)</option>
            <option value="checked-out">
              Checked Out (Completed / Free Room)
            </option>
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="edit-res-purpose"
            className="text-brand-900 mb-2 block text-sm font-medium"
          >
            Purpose of Stay
          </label>
          <textarea
            id="edit-res-purpose"
            name="purpose"
            value={form.purpose}
            onChange={(e) => setField("purpose", e.target.value)}
            rows={3}
            placeholder="e.g. Business trip, Family vacation, Medical treatment, etc."
            className="text-brand-900 focus:ring-primary-400 w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-hidden focus:ring-2"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={updateReservationMut.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={updateReservationMut.isPending}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
