import React, { useState } from "react";
import { useHotelOS } from "../../../app/providers.jsx";
import { updateGuest } from "../../../services/guest.service.js";

const ID_TYPES = [
  "Aadhaar",
  "PAN",
  "Passport",
  "Driving License",
  "Voter ID",
  "Other",
];

export default function EditGuestModal({ guest, onClose, onSaved }) {
  const { refreshData } = useHotelOS();

  const [form, setForm] = useState({
    name: guest.name || "",
    email: guest.email || "",
    phone: guest.phone || "",
    address: guest.address || "",
    idType: guest.idType || "Aadhaar",
    idNumber: guest.idNumber || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setError("");

    if (!form.name.trim()) return setError("Guest name is required.");
    if (!form.email.trim()) return setError("Email is required.");

    try {
      setSaving(true);
      await updateGuest(guest.id, form);
      await refreshData();
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("Failed to update guest:", err);
      setError(err.message || "Failed to update the guest.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-gold-400";
  const labelCls =
    "text-xs font-semibold text-gray-500 uppercase tracking-wide";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-navy-900 flex items-center justify-between rounded-t-2xl p-5">
          <div>
            <div className="text-gold-400 text-xs font-semibold tracking-widest uppercase">
              Edit Guest
            </div>
            <div className="mt-0.5 text-lg font-bold text-white">
              {guest.name}
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

        <div className="space-y-3 p-5">
          <div>
            <label className={labelCls}>Guest Name *</label>
            <input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              disabled={saving}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                disabled={saving}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                disabled={saving}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Address</label>
            <input
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              disabled={saving}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>ID Type</label>
              <select
                value={form.idType}
                onChange={(e) => setField("idType", e.target.value)}
                disabled={saving}
                className={inputCls}
              >
                {ID_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>ID Number</label>
              <input
                value={form.idNumber}
                onChange={(e) => setField("idNumber", e.target.value)}
                disabled={saving}
                className={inputCls}
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
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-navy-900 hover:bg-navy-800 flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
