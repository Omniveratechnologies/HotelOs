import React, { useState } from "react";

export default function AddRoomModal({ onClose, onAdd }) {
  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState(1);
  const [type, setType] = useState("Standard");
  const [rate, setRate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!roomNumber.trim()) {
      setError("Room number is required.");
      return;
    }

    if (!rate || Number(rate) <= 0) {
      setError("Please enter a valid rate.");
      return;
    }

    try {
      setSaving(true);
      await onAdd({
        roomNumber: roomNumber.trim(),
        type,
        rate: Number(rate),
        floor: Number(floor),
      });
      onClose();
    } catch (err) {
      console.error("Failed to create room:", err);
      setError(err.message || "Failed to create room.");
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
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-navy-900 flex items-center justify-between rounded-t-2xl p-5">
          <div>
            <div className="text-gold-400 text-xs font-semibold tracking-widest uppercase">
              Add Room
            </div>
            <div className="mt-0.5 text-lg font-bold text-white">
              Create a New Room
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
        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          <div>
            <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Room Number *
            </label>
            <input
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. 101"
              autoFocus
              disabled={saving}
              className="focus:border-gold-400 mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Floor *
            </label>
            <input
              type="number"
              min="0"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              disabled={saving}
              className="focus:border-gold-400 mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={saving}
                className="focus:border-gold-400 mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-hidden"
              >
                <option>Standard</option>
                <option>Deluxe</option>
                <option>Suite</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Rate / Night *
              </label>
              <input
                type="number"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="₹2500"
                disabled={saving}
                className="focus:border-gold-400 mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-hidden"
              />
            </div>
          </div>

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
              className="bg-navy-900 hover:bg-navy-800 flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors"
            >
              {saving ? "Creating..." : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
