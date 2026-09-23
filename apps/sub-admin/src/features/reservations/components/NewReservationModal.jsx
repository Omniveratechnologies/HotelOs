import { useState } from "react";
import Modal from "../../../components/ui/Modal.jsx";
import Button from "../../../components/ui/Button.jsx";
import { Input } from "../../../components/ui/Input.jsx";
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

  const [docs, setDocs] = useState([]); // [{ file, docType }]
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
        setFileError("Only JPG, PNG, WEBP, or PDF documents are supported.");
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
    if (!form.email.trim()) return setError("Guest email is required.");
    if (!form.roomId) return setError("Please select a room.");
    if (!form.checkOut) return setError("Check-out date is required.");
    if (form.checkIn && new Date(form.checkOut) <= new Date(form.checkIn)) {
      return setError("Check-out date must be after check-in date.");
    }

    try {
      const result = await createReservationMut.mutateAsync({
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

      if (result?.credentials) {
        setCredentials(result.credentials);
      } else {
        onCreated?.(result);
        onClose();
      }
    } catch (err) {
      console.error("Create reservation error:", err);
      setError(err.message || "Failed to create reservation.");
    }
  };

  const handleCopyCredentials = () => {
    if (!credentials) return;
    const text = `Username: ${credentials.username}\nPassword: ${credentials.temporaryPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={credentials ? "Reservation Created!" : "New Reservation"}
      subtitle={
        credentials
          ? "Guest portal credentials generated successfully."
          : "Book a room for an upcoming or walk-in guest."
      }
    >
      {credentials ? (
        <div className="space-y-5 py-2">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <h4 className="text-sm font-semibold text-green-900">
              Stay Registered Successfully
            </h4>
            <p className="mt-1 text-xs text-green-700">
              {credentials.emailSent
                ? "Login credentials have been emailed to the guest."
                : "Guest portal access has been provisioned. Share the credentials below:"}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">Username:</span>
              <span className="font-mono font-bold text-gray-800">
                {credentials.username}
              </span>
            </div>
            {credentials.temporaryPassword && (
              <div className="flex justify-between border-t border-gray-200 py-1.5">
                <span className="text-gray-500">Temporary Password:</span>
                <span className="text-brand-900 font-mono font-bold">
                  {credentials.temporaryPassword}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleCopyCredentials}
            >
              {copied ? "Copied to Clipboard!" : "Copy Credentials"}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                onCreated?.();
                onClose();
              }}
            >
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Guest Full Name *"
              name="name"
              placeholder="e.g. John Doe"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
            />
            <Input
              label="Email Address *"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Phone Number"
              name="phone"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
            <div className="mb-4">
              <label
                htmlFor="res-status"
                className="text-brand-900 mb-2 block text-sm font-medium"
              >
                Reservation Status
              </label>
              <select
                id="res-status"
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className="text-brand-900 focus:ring-primary-400 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-hidden focus:ring-2"
              >
                <option value="reserved">Reserved (Upcoming)</option>
                <option value="checked-in">
                  Checked In (Walk-in / Immediate)
                </option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="res-room"
              className="text-brand-900 mb-2 block text-sm font-medium"
            >
              Assign Room *
            </label>
            <select
              id="res-room"
              value={form.roomId}
              onChange={(e) => setField("roomId", e.target.value)}
              className="text-brand-900 focus:ring-primary-400 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-hidden focus:ring-2"
              required
            >
              <option value="">Select an available room...</option>
              {selectableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} ({r.type} - ₹{r.rate || 0}/night)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Check-In Date *"
              name="checkIn"
              type="date"
              value={form.checkIn}
              onChange={(e) => setField("checkIn", e.target.value)}
              required
            />
            <Input
              label="Check-Out Date *"
              name="checkOut"
              type="date"
              value={form.checkOut}
              onChange={(e) => setField("checkOut", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="mb-4">
              <label
                htmlFor="res-idType"
                className="text-brand-900 mb-2 block text-sm font-medium"
              >
                Government ID Type
              </label>
              <select
                id="res-idType"
                value={form.idType}
                onChange={(e) => setField("idType", e.target.value)}
                className="text-brand-900 focus:ring-primary-400 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-hidden focus:ring-2"
              >
                {ID_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="ID Number"
              name="idNumber"
              placeholder="e.g. 1234-5678-9012"
              value={form.idNumber}
              onChange={(e) => setField("idNumber", e.target.value)}
            />
          </div>

          <Input
            label="Address"
            name="address"
            placeholder="Guest residential address"
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
          />

          {/* Document Upload */}
          <div className="space-y-2">
            <label
              htmlFor="res-file-upload"
              className="text-brand-900 block text-sm font-medium"
            >
              Identity Documents (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label
                htmlFor="res-file-upload"
                className="border-primary-300 text-primary-600 hover:bg-primary-50 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-2.5 text-xs font-semibold transition"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Choose Documents
                <input
                  id="res-file-upload"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFiles}
                />
              </label>
              <span className="text-xs text-gray-400">
                Max 5 files (JPG, PNG, PDF up to 5MB each)
              </span>
            </div>

            {fileError && <p className="text-xs text-red-500">{fileError}</p>}

            {docs.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {docs.map((d, idx) => (
                  <div
                    key={`${d.file.name}-${d.file.size}-${d.file.lastModified || idx}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs"
                  >
                    <span className="truncate font-medium text-gray-700">
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

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={createReservationMut.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createReservationMut.isPending}
            >
              Confirm Reservation
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
