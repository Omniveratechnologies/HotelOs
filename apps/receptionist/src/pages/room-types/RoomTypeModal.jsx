import { useState } from "react";
import {
  createRoomType,
  updateRoomType,
} from "../../services/roomType.service.js";

const inputClass =
  "focus:border-primary-400 mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-hidden";
const rowInputClass =
  "focus:border-primary-400 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-hidden";

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

export default function RoomTypeModal({ roomType, onClose, onSaved }) {
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
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCountChange = (value) => {
    setCount(value);
    const target = Math.max(1, Number(value) || 1);

    setRows((previous) => {
      const next = previous.slice(0, target);

      while (next.length < target) {
        next.push(makeRow());
      }

      return next;
    });
  };

  const setRow = (index, field, value) =>
    setRows((previous) =>
      previous.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!roomCode.trim()) {
      setError("Room code is required.");
      return;
    }

    const countNum = Number(count);

    if (count === "" || Number.isNaN(countNum) || countNum < 1) {
      setError("Count must be at least 1.");
      return;
    }

    const minNum = Number(minOccupancy);

    if (minOccupancy === "" || Number.isNaN(minNum) || minNum < 1) {
      setError("Min occupancy must be at least 1.");
      return;
    }

    if (maxOccupancy.trim() !== "" && Number.isNaN(Number(maxOccupancy))) {
      setError("Max occupancy must be a number or left empty.");
      return;
    }

    if (maxOccupancy.trim() !== "" && Number(maxOccupancy) < minNum) {
      setError("Max occupancy must be >= min occupancy.");
      return;
    }

    if (!isEdit) {
      const seen = new Set();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const num = row.roomNumber.trim();

        if (!num) {
          setError(`Room number is required for room ${i + 1}.`);
          return;
        }

        if (seen.has(num.toLowerCase())) {
          setError(`Duplicate room number: "${num}".`);
          return;
        }
        seen.add(num.toLowerCase());

        if (
          row.rate === "" ||
          Number.isNaN(Number(row.rate)) ||
          Number(row.rate) < 0
        ) {
          setError(`Room "${num}" has an invalid rate.`);
          return;
        }

        if (
          row.floor === "" ||
          Number.isNaN(Number(row.floor)) ||
          Number(row.floor) < 0
        ) {
          setError(`Room "${num}" has an invalid floor.`);
          return;
        }
      }
    }

    try {
      setSaving(true);

      const saved = isEdit
        ? await updateRoomType(roomType.id, {
            name: name.trim(),
            minOccupancy: minNum,
            maxOccupancy:
              maxOccupancy.trim() === "" ? null : Number(maxOccupancy),
            active,
          })
        : await createRoomType({
            name: name.trim(),
            roomCode: roomCode.trim().toLowerCase(),
            description: description.trim(),
            count: countNum,
            minOccupancy: minNum,
            maxOccupancy:
              maxOccupancy.trim() === "" ? null : Number(maxOccupancy),
            active,
            rooms: rows.map((row) => ({
              roomNumber: row.roomNumber.trim(),
              rate: Number(row.rate),
              floor: Number(row.floor),
            })),
          });

      onSaved(saved);
      onClose();
    } catch (err) {
      console.error("Failed to save room type:", err);
      setError(err.message || "Failed to save room type.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-brand-900 flex items-center justify-between rounded-t-2xl p-5">
          <div>
            <div className="text-primary-400 text-xs font-semibold tracking-widest uppercase">
              {isEdit ? `Edit ${roomType.name}` : "Add Room Type"}
            </div>
            <div className="mt-0.5 text-lg font-bold text-white">
              {isEdit ? "Update Room Type" : "Create a New Room Type"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 transition-colors hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="max-h-[80vh] space-y-3 overflow-y-auto p-5"
        >
          <div>
            <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Executive"
              autoFocus
              disabled={saving}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Room code *
            </label>
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="e.g. executive"
              disabled={saving || isEdit}
              className={inputClass}
            />
            {isEdit ? (
              <p className="mt-1 text-[11px] text-gray-400">
                The code is locked once created — it identifies this type in the
                property.
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-gray-400">
                This becomes the Aiosell room code for every room of this type.
              </p>
            )}
          </div>

          {!isEdit && (
            <div>
              <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Description
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Free Wifi"
                disabled={saving}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Room count *
            </label>
            <input
              type="number"
              min="1"
              value={count}
              onChange={(e) =>
                isEdit ? null : handleCountChange(e.target.value)
              }
              disabled={saving || isEdit}
              className={inputClass}
            />
            {isEdit ? (
              <p className="mt-1 text-[11px] text-gray-400">
                Count is managed from the Rooms section — add or delete rooms
                there to change it.
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-gray-400">
                Set the number of rooms, then fill each room's details below.
              </p>
            )}
          </div>

          {!isEdit && (
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              {rows.map((row, i) => (
                <div
                  key={row.rowKey}
                  className="rounded-xl bg-white p-3 shadow-xs"
                >
                  <div className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
                    Room {i + 1}
                  </div>
                  <div className="mt-1.5 grid grid-cols-[1fr_1fr_1fr] gap-2">
                    <input
                      className={rowInputClass}
                      placeholder="Number e.g. 101"
                      value={row.roomNumber}
                      onChange={(e) => setRow(i, "roomNumber", e.target.value)}
                      disabled={saving}
                    />
                    <input
                      type="number"
                      min="0"
                      className={rowInputClass}
                      placeholder="Rate"
                      title="Daily rate (₹)"
                      value={row.rate}
                      onChange={(e) => setRow(i, "rate", e.target.value)}
                      disabled={saving}
                    />
                    <input
                      type="number"
                      min="0"
                      className={rowInputClass}
                      placeholder="Floor"
                      title="Floor"
                      value={row.floor}
                      onChange={(e) => setRow(i, "floor", e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Min occ. *
              </label>
              <input
                type="number"
                min="1"
                value={minOccupancy}
                onChange={(e) => setMinOccupancy(e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Max occ.
              </label>
              <input
                type="number"
                min="1"
                placeholder="None"
                value={maxOccupancy}
                onChange={(e) => setMaxOccupancy(e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              disabled={saving}
              className="text-primary-500 h-4 w-4 rounded border-gray-300"
            />
            <span className="text-xs font-medium text-gray-600">
              Active (visible in room and rate plan forms)
            </span>
          </label>

          <p className="text-[11px] leading-relaxed text-gray-400">
            The new type and its rooms show as <b>Under review</b> until a super
            admin creates them in the property and verifies.
          </p>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-900 hover:bg-brand-800 flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Room Type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
