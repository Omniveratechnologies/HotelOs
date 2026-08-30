import React, { useState } from "react";
import { useHotelOS } from "../../../app/providers.jsx";

const ID_TYPES = [
  "Aadhaar",
  "PAN",
  "Passport",
  "Driving License",
  "Voter ID",
  "Other",
];

export default function AddGuestModal({
  onClose,
  onRegistered,
  initial = null,
}) {
  const { rooms, addGuest } = useHotelOS();

  const [form, setForm] = useState({
    name: initial?.name || "",
    phone: "",
    email: "",
    address: "",
    roomId: initial?.roomId || "",
    checkIn: initial?.checkIn || new Date().toISOString().split("T")[0],
    checkOut: initial?.checkOut || "",
    idType: "Aadhaar",
    idNumber: "",
    status: "checked-in",
  });

  const [docs, setDocs] = useState([]); // [{ file, docType }]
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setDocs(files.slice(0, 5).map((file) => ({ file, docType: form.idType })));
  };

  const setDocType = (idx, docType) => {
    setDocs((prev) => prev.map((d, i) => (i === idx ? { ...d, docType } : d)));
  };

  const handleSubmit = async () => {
    setError("");

    if (!form.name.trim()) return setError("Guest name is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (!form.roomId) return setError("Please select a room.");
    if (!form.checkOut) return setError("Check-out date is required.");

    try {
      setSaving(true);

      const created = await addGuest({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        address: form.address,
        idType: form.idType,
        idNumber: form.idNumber,
        roomId: form.roomId,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        status: form.status,
        docTypes: docs.map((d) => d.docType),
        files: docs.map((d) => d.file),
      });

      onRegistered?.(created);
      setCredentials(created.credentials || null);
    } catch (err) {
      console.error("Failed to register guest:", err);
      setError(err.message || "Failed to register the guest.");
    } finally {
      setSaving(false);
    }
  };

  // When prefilled, only that room can be chosen; otherwise free rooms
  const selectableRooms = initial?.roomId
    ? rooms.filter((r) => r.id === initial.roomId)
    : rooms.filter((r) => ["available", "cleaning"].includes(r.status));

  const inputCls =
    "w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-gold-400";
  const labelCls =
    "text-xs font-semibold text-gray-500 uppercase tracking-wide";

  // =====================================================
  // SUCCESS PANEL - generated credentials shown once
  // =====================================================

  if (credentials) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl text-green-600">
              ✓
            </div>
            <h3 className="text-navy-900 text-lg font-bold">
              Guest Registered
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Login credentials were generated
              {credentials.emailSent ? " and emailed" : ""}. Save them now — the
              password won&apos;t be shown again.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <div>
                <div className={labelCls}>Username</div>
                <div className="text-navy-900 font-bold">
                  {credentials.username}
                </div>
              </div>
              <button
                onClick={() =>
                  navigator.clipboard?.writeText(credentials.username)
                }
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50"
              >
                Copy
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
              <div>
                <div className={labelCls}>Temporary Password</div>
                <div className="text-navy-900 font-mono font-bold">
                  {credentials.temporaryPassword}
                </div>
              </div>
              <button
                onClick={() =>
                  navigator.clipboard?.writeText(credentials.temporaryPassword)
                }
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-white"
              >
                Copy
              </button>
            </div>

            {!credentials.emailSent && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                The email could not be sent. Please share these credentials
                manually.
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="bg-navy-900 hover:bg-navy-800 mt-5 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-navy-900 sticky top-0 flex items-center justify-between rounded-t-2xl p-5">
          <div>
            <div className="text-gold-400 text-xs font-semibold tracking-widest uppercase">
              Register Guest
            </div>
            <div className="mt-0.5 text-lg font-bold text-white">
              {initial ? `Room ${initial.roomNumber}` : "New Guest"}
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
        <div className="space-y-3 p-5">
          <div>
            <label className={labelCls}>Guest Name *</label>
            <input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Full name"
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
                placeholder="guest@email.com"
                disabled={saving}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+91 XXXXX XXXXX"
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
              placeholder="City, State"
              disabled={saving}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Room *</label>
              <select
                value={form.roomId}
                onChange={(e) => setField("roomId", e.target.value)}
                disabled={saving || !!initial?.roomId}
                className={inputCls}
              >
                <option value="">Select</option>
                {selectableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} ({r.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Booking Type</label>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                disabled={saving}
                className={inputCls}
              >
                <option value="checked-in">Check In Now</option>
                <option value="reserved">Reserve for Later</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Check In *</label>
              <input
                type="date"
                value={form.checkIn}
                onChange={(e) => setField("checkIn", e.target.value)}
                disabled={saving}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Check Out *</label>
              <input
                type="date"
                value={form.checkOut}
                onChange={(e) => setField("checkOut", e.target.value)}
                disabled={saving}
                className={inputCls}
              />
            </div>
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
                placeholder="XXXX-XXXX-XXXX"
                disabled={saving}
                className={inputCls}
              />
            </div>
          </div>

          {/* Documents */}
          <div>
            <label className={labelCls}>
              Documents (max 5 · JPG/PNG/PDF/WEBP · 5MB each)
            </label>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFiles}
              disabled={saving}
              className="file:text-navy-900 mt-1 w-full text-sm text-gray-500 file:mr-3 file:rounded-xl file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
            />
            {docs.length > 0 && (
              <div className="mt-2 space-y-2">
                {docs.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-1 truncate text-xs text-gray-600">
                      {d.file.name}
                    </span>
                    <select
                      value={d.docType}
                      onChange={(e) => setDocType(i, e.target.value)}
                      disabled={saving}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                    >
                      {ID_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        setDocs((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="px-1 text-sm text-red-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              onClick={handleSubmit}
              disabled={saving}
              className="bg-navy-900 hover:bg-navy-800 flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors"
            >
              {saving ? "Registering..." : "Register Guest"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
