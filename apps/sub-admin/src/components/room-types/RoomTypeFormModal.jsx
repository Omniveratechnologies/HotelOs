import { useState } from "react";

import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";

import {
  createRoomType,
  updateRoomType,
} from "../../services/roomType.service.js";

const roomIndexClass =
  "text-brand-900 focus:ring-primary-400 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-hidden focus:ring-2";

let nextRowKey = 0;

function makeRow(row = {}) {
  nextRowKey += 1;
  return {
    ...row,
    rowKey: row.rowKey || `room-row-${nextRowKey}`,
    roomNumber: row.roomNumber || "",
    rate: row.rate ?? "2500",
    floor: row.floor ?? "1",
  };
}

function makeRows(count) {
  const size = Math.max(1, Number(count) || 1);
  return Array.from({ length: size }, () => makeRow());
}

export default function RoomTypeFormModal({ roomType, onClose, onSaved }) {
  const isEdit = Boolean(roomType);

  const [name, setName] = useState(roomType?.name || "");
  const [roomCode, setRoomCode] = useState(roomType?.roomCode || "");
  const [description, setDescription] = useState(roomType?.description || "");
  const [count, setCount] = useState(
    roomType?.count != null ? String(roomType.count) : "1",
  );
  const [rows, setRows] = useState(() =>
    roomType?.rooms?.length
      ? roomType.rooms.map(makeRow)
      : makeRows(roomType?.count || 1),
  );
  const [minOccupancy, setMinOccupancy] = useState(
    roomType?.minOccupancy != null ? String(roomType.minOccupancy) : "1",
  );
  const [maxOccupancy, setMaxOccupancy] = useState(
    roomType?.maxOccupancy != null ? String(roomType.maxOccupancy) : "",
  );
  const [active, setActive] = useState(roomType?.active !== false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleCountChange(value) {
    setCount(value);
    const target = Math.max(1, Number(value) || 1);

    setRows((previous) => {
      const next = previous.slice(0, target);

      while (next.length < target) {
        next.push(makeRow());
      }

      return next;
    });
  }

  function setRow(index, field, value) {
    setRows((previous) =>
      previous.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    );
  }

  function validate() {
    const next = {};

    if (!name.trim()) {
      next.name = "Name is required.";
    }

    if (!roomCode.trim()) {
      next.roomCode = "Aiosell room code is required.";
    }

    const countNum = Number(count);

    if (count === "" || Number.isNaN(countNum) || countNum < 1) {
      next.count = "Count must be at least 1.";
    }

    const minNum = Number(minOccupancy);

    if (minOccupancy === "" || Number.isNaN(minNum) || minNum < 1) {
      next.minOccupancy = "Must be at least 1.";
    }

    if (maxOccupancy.trim() !== "" && Number.isNaN(Number(maxOccupancy))) {
      next.maxOccupancy = "Enter a number or leave empty.";
    } else if (maxOccupancy.trim() !== "" && Number(maxOccupancy) < minNum) {
      next.maxOccupancy = "Must be >= min occupancy.";
    }

    if (!isEdit) {
      const seen = new Set();
      const roomErrors = [];

      rows.forEach((row, i) => {
        const num = row.roomNumber.trim();

        if (!num) {
          roomErrors[i] = "Room number is required.";
          return;
        }

        if (seen.has(num.toLowerCase())) {
          roomErrors[i] = "Duplicate room number.";
        }
        seen.add(num.toLowerCase());

        if (
          row.rate === "" ||
          Number.isNaN(Number(row.rate)) ||
          Number(row.rate) < 0
        ) {
          roomErrors[i] = "Enter a valid rate.";
        }

        if (
          row.floor === "" ||
          Number.isNaN(Number(row.floor)) ||
          Number(row.floor) < 0
        ) {
          roomErrors[i] = "Enter a valid floor.";
        }
      });

      if (roomErrors.some(Boolean)) {
        next.rooms = roomErrors;
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        minOccupancy: Number(minOccupancy),
        maxOccupancy: maxOccupancy.trim() === "" ? null : Number(maxOccupancy),
        active,
      };

      if (isEdit) {
        const saved = await updateRoomType(roomType.id, payload);

        onSaved?.(saved);
        onClose();
        return;
      }

      const saved = await createRoomType({
        ...payload,
        roomCode: roomCode.trim().toLowerCase(),
        description: description.trim(),
        count: Number(count),
        rooms: rows.map((row) => ({
          roomNumber: row.roomNumber.trim(),
          rate: Number(row.rate),
          floor: Number(row.floor),
        })),
      });

      onSaved?.(saved);
      onClose();
    } catch (error) {
      console.error("Save room type error:", error);
      setErrors({ form: error.message || "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={isEdit ? `Edit ${roomType.name}` : "Add Room Type"}
      subtitle={
        isEdit
          ? "Update the room type's configuration. The room code and count are managed by the Rooms section."
          : "Create a room type with its rooms. Everything stays Under review until a super admin verifies it in the property."
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          name="name"
          label="Name"
          placeholder="e.g. Executive"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <div className="mb-4">
          <label
            htmlFor="roomCode"
            className="text-brand-900 mb-2 block text-sm font-medium"
          >
            Room code
          </label>
          <input
            id="roomCode"
            className="text-brand-900 focus:ring-primary-400 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 outline-hidden focus:ring-2 disabled:bg-gray-50 disabled:text-gray-400"
            placeholder="e.g. executive"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            readOnly={isEdit}
            disabled={isEdit}
          />
          {errors.roomCode ? (
            <p className="mt-2 text-sm text-red-600">{errors.roomCode}</p>
          ) : isEdit ? (
            <p className="mt-2 text-xs text-gray-500">
              The code is locked once created — it identifies this type in the
              property.
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-500">
              This becomes the Aiosell room code for every room of this type.
            </p>
          )}
        </div>

        {!isEdit && (
          <Input
            name="description"
            label="Description"
            placeholder="e.g. Free Wifi"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
          />
        )}

        <div className="mb-4">
          <label
            htmlFor="count"
            className="text-brand-900 mb-2 block text-sm font-medium"
          >
            {isEdit ? "Room count" : "Room count"}
          </label>
          <input
            id="count"
            type="number"
            min="1"
            className="text-brand-900 focus:ring-primary-400 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 outline-hidden focus:ring-2 disabled:bg-gray-50 disabled:text-gray-400"
            value={count}
            onChange={(e) =>
              isEdit ? null : handleCountChange(e.target.value)
            }
            disabled={isEdit}
            readOnly={isEdit}
          />
          {errors.count ? (
            <p className="mt-2 text-sm text-red-600">{errors.count}</p>
          ) : isEdit ? (
            <p className="mt-2 text-xs text-gray-500">
              Count is managed from the Rooms section — add or delete rooms
              there to change it.
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-500">
              Set the number of rooms, then fill each room's details below.
            </p>
          )}
        </div>

        {!isEdit && (
          <div className="mb-4">
            <p className="text-brand-900 mb-2 text-sm font-medium">Rooms</p>

            <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              {rows.map((row, i) => (
                <div
                  key={row.rowKey}
                  className="rounded-lg bg-white p-3 shadow-xs"
                >
                  <p className="text-brand-900/60 mb-2 text-[11px] font-semibold tracking-wider uppercase">
                    Room {i + 1}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        className={roomIndexClass}
                        placeholder="Room number e.g. 101"
                        value={row.roomNumber}
                        onChange={(e) =>
                          setRow(i, "roomNumber", e.target.value)
                        }
                      />
                      {errors.rooms?.[i] && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.rooms[i]}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        min="0"
                        className={roomIndexClass}
                        placeholder="Rate"
                        title="Daily rate (₹)"
                        value={row.rate}
                        onChange={(e) => setRow(i, "rate", e.target.value)}
                      />
                      <input
                        type="number"
                        min="0"
                        className={roomIndexClass}
                        placeholder="Floor"
                        title="Floor"
                        value={row.floor}
                        onChange={(e) => setRow(i, "floor", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {errors.rooms && Object.keys(errors.rooms).length === 0 && (
              <p className="mt-2 text-sm text-red-600">{errors.rooms}</p>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="minOccupancy"
              className="text-brand-900 mb-2 block text-sm font-medium"
            >
              Min occupancy
            </label>
            <input
              id="minOccupancy"
              type="number"
              min="1"
              className="text-brand-900 focus:ring-primary-400 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 outline-hidden focus:ring-2"
              value={minOccupancy}
              onChange={(e) => setMinOccupancy(e.target.value)}
            />
            {errors.minOccupancy && (
              <p className="mt-2 text-sm text-red-600">{errors.minOccupancy}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="maxOccupancy"
              className="text-brand-900 mb-2 block text-sm font-medium"
            >
              Max occupancy
            </label>
            <input
              id="maxOccupancy"
              type="number"
              min="1"
              placeholder="None"
              className="text-brand-900 focus:ring-primary-400 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 outline-hidden focus:ring-2"
              value={maxOccupancy}
              onChange={(e) => setMaxOccupancy(e.target.value)}
            />
            {errors.maxOccupancy && (
              <p className="mt-2 text-sm text-red-600">{errors.maxOccupancy}</p>
            )}
          </div>
        </div>

        <label className="mt-4 mb-4 flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="text-primary-500 h-4 w-4 rounded border-gray-300"
          />
          <span>
            <span className="text-brand-900 block text-sm font-medium">
              Active
            </span>
            <span className="block text-xs text-gray-500">
              Inactive types stay hidden from room and rate plan forms.
            </span>
          </span>
        </label>

        {errors.form && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">
            {errors.form}
          </p>
        )}

        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEdit ? "Save changes" : "Add room type"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
