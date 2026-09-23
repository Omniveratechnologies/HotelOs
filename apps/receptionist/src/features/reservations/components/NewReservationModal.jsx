import React, { useState } from "react";
import { useRooms } from "../../rooms/hooks/useRooms.js";
import { useCreateReservation } from "../hooks/useReservations.js";

const ID_TYPES = [
  "Aadhaar",
  "PAN",
  "Passport",
  "Driving License",
  "Voter ID",
  "Other",
];

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export default function NewReservationModal({ open, onClose, onCreated }) {
  const { rooms = [] } = useRooms();
  const createReservationMut = useCreateReservation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    idType: "Aadhaar",
    idNumber: "",
    roomId: "",
    checkIn: new Date().toISOString().split("T")[0],
    checkOut: "",
    status: "reserved",
  });

  const [docs, setDocs] = useState([]);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectableRooms = rooms.filter(
    (r) =>
      r.channelVerified !== false &&
      ["available", "cleaning"].includes(r.status),
  );

  const handleFiles = (e) => {
    const incoming = Array.from(e.target.files || []);
    if (incoming.length === 0) return;

    setFileError("");
    const valid = [];
    for (const file of incoming) {
      if (!ACCEPTED_TYPES.has(file.type)) {
        setFileError("Only JPG, PNG, WEBP, or PDF files are accepted.");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFileError(`${file.name} exceeds 5MB size limit.`);
        continue;
      }
      valid.push({ file, docType: form.idType });
    }
    setDocs((prev) => [...prev, ...valid]);
    e.target.value = "";
  };

  const removeDoc = (idx) => {
    setDocs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Guest name is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (!form.roomId) return setError("Please select an available room.");
    if (!form.checkOut) return setError("Check-out date is required.");
    if (form.checkIn && new Date(form.checkOut) <= new Date(form.checkIn)) {
      return setError("Check-out must be after check-in date.");
    }

    try {
      const res = await createReservationMut.mutateAsync({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        idType: form.idType,
        idNumber: form.idNumber.trim(),
        roomId: form.roomId,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        status: form.status,
        docTypes: docs.map((d) => d.docType),
        files: docs.map((d) => d.file),
      });

      if (res?.credentials) {
        setCredentials(res.credentials);
      } else {
        onCreated?.(res);
        onClose();
      }
    } catch (err) {
      console.error("Create reservation error:", err);
      setError(err.message || "Failed to create reservation.");
    }
  };

  const handleCopy = () => {
    if (!credentials) return;
    navigator.clipboard.writeText(
      `Username: ${credentials.username}\nPassword: ${credentials.temporaryPassword}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-brand-900 text-lg font-bold">
              {credentials ? "Reservation Created!" : "New Reservation"}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {credentials
                ? "Guest account and reservation have been registered."
                : "Enter guest details and assign a room for the stay."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {credentials ? (
          <div className="space-y-5 pt-4">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <h4 className="text-sm font-semibold text-green-900">
                Reservation Confirmed
              </h4>
              <p className="mt-1 text-xs text-green-700">
                {credentials.emailSent
                  ? "Login credentials have been emailed to the guest."
                  : "Portal credentials provisioned. Share these with the guest:"}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Username:</span>
                <span className="font-mono font-bold text-gray-800">
                  {credentials.username}
                </span>
              </div>
              {credentials.temporaryPassword && (
                <div className="flex justify-between border-t border-gray-200 py-1">
                  <span className="text-gray-500">Temporary Password:</span>
                  <span className="text-brand-900 font-mono font-bold">
                    {credentials.temporaryPassword}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                {copied ? "Copied!" : "Copy Credentials"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onCreated?.();
                  onClose();
                }}
                className="bg-brand-900 hover:bg-brand-800 flex-1 rounded-xl py-2.5 text-sm font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-600">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-brand-900 block text-xs font-semibold">
                  Guest Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className="focus:border-brand-900 mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-brand-900 block text-xs font-semibold">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  className="focus:border-brand-900 mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-brand-900 block text-xs font-semibold">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  className="focus:border-brand-900 mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-brand-900 block text-xs font-semibold">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                  className="focus:border-brand-900 mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-hidden"
                >
                  <option value="reserved">Reserved (Upcoming)</option>
                  <option value="checked-in">Checked In (Walk-in)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-brand-900 block text-xs font-semibold">
                Room *
              </label>
              <select
                required
                value={form.roomId}
                onChange={(e) => setField("roomId", e.target.value)}
                className="focus:border-brand-900 mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-hidden"
              >
                <option value="">Select available room...</option>
                {selectableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} ({r.type} - ₹{r.rate || 0}/night)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-brand-900 block text-xs font-semibold">
                  Check In *
                </label>
                <input
                  type="date"
                  required
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-brand-900 block text-xs font-semibold">
                  ID Type
                </label>
                <select
                  value={form.idType}
                  onChange={(e) => setField("idType", e.target.value)}
                  className="focus:border-brand-900 mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-hidden"
                >
                  {ID_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-brand-900 block text-xs font-semibold">
                  ID Number
                </label>
                <input
                  type="text"
                  placeholder="ID document number"
                  value={form.idNumber}
                  onChange={(e) => setField("idNumber", e.target.value)}
                  className="focus:border-brand-900 mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-brand-900 block text-xs font-semibold">
                Address
              </label>
              <input
                type="text"
                placeholder="Guest address"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                className="focus:border-brand-900 mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-hidden"
              />
            </div>

            {/* Document Upload */}
            <div>
              <label className="text-brand-900 block text-xs font-semibold">
                Identity Documents
              </label>
              <div className="mt-1 flex items-center gap-3">
                <label className="hover:bg-brand-50 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gray-300 px-3.5 py-2 text-xs font-semibold text-gray-700 transition">
                  <span>📎 Attach Files</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={handleFiles}
                  />
                </label>
                <span className="text-xs text-gray-400">
                  JPG, PNG, PDF up to 5MB
                </span>
              </div>
              {fileError && (
                <p className="mt-1 text-xs text-red-500">{fileError}</p>
              )}
              {docs.length > 0 && (
                <div className="mt-2 space-y-1">
                  {docs.map((d, idx) => (
                    <div
                      key={`${d.file.name}-${d.file.size}-${d.file.lastModified || idx}`}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs"
                    >
                      <span className="truncate text-gray-700">
                        📄 {d.file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDoc(idx)}
                        className="text-xs font-semibold text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={createReservationMut.isPending}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createReservationMut.isPending}
                className="bg-brand-900 hover:bg-brand-800 flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {createReservationMut.isPending
                  ? "Creating..."
                  : "Confirm Booking"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
