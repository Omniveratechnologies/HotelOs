import { useMemo, useState } from "react";

import Modal from "../../../components/ui/Modal.jsx";
import Button from "../../../components/ui/Button.jsx";
import { Input } from "../../../components/ui/Input.jsx";

import { useCreateRoom, useUpdateRoom } from "../hooks/useRooms.js";
import { useAiosellRoomTypes } from "../../settings/hooks/useHotelSettings.js";

const selectClass =
  "text-brand-900 focus:ring-primary-400 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 outline-hidden focus:ring-2";

export default function RoomFormModal({ room, onClose, onSaved }) {
  const [roomNumber, setRoomNumber] = useState(room?.roomNumber || "");
  const [code, setCode] = useState(room?.roomCode || "");
  const [typeLabel, setTypeLabel] = useState(room?.type || "");
  const [rate, setRate] = useState(
    room?.rate != null ? String(room.rate) : "2500",
  );
  const [floor, setFloor] = useState(
    room?.floor != null ? String(room.floor) : "1",
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const {
    aiosellRoomTypes: roomTypes,
    isLoading: typesLoading,
    error: typesError,
  } = useAiosellRoomTypes();
  const createRoomMutation = useCreateRoom();
  const updateRoomMutation = useUpdateRoom();

  const options = useMemo(() => {
    const base = roomTypes.map((t) => ({
      value: t.code,
      label: t.name,
      name: t.name,
      code: t.code,
      description: t.description || "",
      minOccupancy: t.minOccupancy,
      maxOccupancy: t.maxOccupancy,
      active: t.active,
    }));

    // Keep an existing room's current type in the list even if the hotel has
    // not synced it yet (legacy / pre-sync rooms).
    if (room && room.roomCode && !base.some((o) => o.code === room.roomCode)) {
      base.push({
        value: room.roomCode,
        label: room.type,
        name: room.type,
        code: room.roomCode,
        description: "",
        minOccupancy: null,
        maxOccupancy: null,
        active: true,
      });
    }
    if (room && !room.roomCode && room.type) {
      base.push({
        value: "",
        label: room.type,
        name: room.type,
        code: "",
        description: "",
        minOccupancy: null,
        maxOccupancy: null,
        active: true,
      });
    }

    return base;
  }, [roomTypes, room]);

  const selected = options.find((o) => o.value === code) || null;
  const noTypes = !typesLoading && options.filter((o) => o.code).length === 0;

  function handleTypeChange(nextCode) {
    setCode(nextCode);

    const option = options.find((o) => o.value === nextCode);
    setTypeLabel(option?.name || "");
  }

  function validate() {
    const next = {};

    if (!roomNumber.trim()) {
      next.roomNumber = "Room number is required.";
    }

    if (!code) {
      next.type = "Pick a room type.";
    }

    const rateNum = Number(rate);

    if (rate === "" || Number.isNaN(rateNum) || rateNum < 0) {
      next.rate = "Enter a valid daily rate.";
    }

    if (floor === "" || Number.isNaN(Number(floor))) {
      next.floor = "Enter the floor number.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate() || !typeLabel.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        roomNumber: roomNumber.trim(),
        type: typeLabel.trim(),
        rate: Number(rate),
        floor: Number(floor),
        roomCode: code.trim() || undefined,
      };

      const saved = room
        ? await updateRoomMutation.mutateAsync({ id: room.id, data: payload })
        : await createRoomMutation.mutateAsync(payload);

      onSaved?.(saved);
      onClose();
    } catch (error) {
      console.error("Save room error:", error);
      setErrors({ form: error.message || "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={room ? `Edit Room ${room.roomNumber}` : "Add Room"}
      subtitle={
        room
          ? "Update the room's details. Its type and code belong to the hotel's room types."
          : "Create a room. Its type and Aiosell code come from the hotel's room types."
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          name="roomNumber"
          label="Room number"
          placeholder="e.g. 101"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          error={errors.roomNumber}
        />

        <div className="mb-4">
          <label
            htmlFor="roomType"
            className="text-brand-900 mb-2 block text-sm font-medium"
          >
            Room type
          </label>
          <select
            id="roomType"
            className={selectClass}
            value={code}
            onChange={(e) => handleTypeChange(e.target.value)}
            disabled={noTypes}
          >
            {typesLoading && <option value="">Loading…</option>}
            {!typesLoading && noTypes && (
              <option value="">No room types yet</option>
            )}
            {options.map((o) => (
              <option key={o.value || "local"} value={o.value}>
                {o.label}
                {o.minOccupancy != null
                  ? ` · ${o.minOccupancy}-${o.maxOccupancy ?? "∞"} guests`
                  : ""}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="mt-2 text-sm text-red-600">{errors.type}</p>
          )}
          {noTypes ? (
            <p className="mt-2 text-xs text-amber-600">
              {typesError ||
                "No room types yet — a super admin must sync the hotel from Aiosell first."}
            </p>
          ) : selected?.description ? (
            <p className="mt-2 text-xs text-gray-500">{selected.description}</p>
          ) : (
            <p className="mt-2 text-xs text-gray-500">
              Picking a type fills the room's Aiosell code automatically.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="rate"
            label="Daily rate (₹)"
            type="number"
            min="0"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            error={errors.rate}
          />

          <Input
            name="floor"
            label="Floor"
            type="number"
            min="0"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            error={errors.floor}
          />
        </div>

        {code ? (
          <div className="mt-1 mb-4 rounded-lg bg-gray-50 px-3.5 py-2.5">
            <p className="text-xs text-gray-500">
              Aiosell code:{" "}
              <span className="font-semibold text-gray-700">{code}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              The room shows <span className="font-medium">Under review</span>{" "}
              until a super admin verifies it (and the type's count) in the
              property.
            </p>
          </div>
        ) : (
          <p className="mt-1 mb-4 text-xs text-gray-500">
            Local room — no Aiosell code.
          </p>
        )}

        {errors.form && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">
            {errors.form}
          </p>
        )}

        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={noTypes && !room}
          >
            {room ? "Save changes" : "Add room"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
