import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { roomsApi, reservationsApi } from "@hotelos/api";
import { cn } from "@hotelos/utils";
import { Modal } from "./Modal.jsx";
import { Button } from "./Button.jsx";
import { Input } from "./Input.jsx";

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

const MAX_FILES = 5;
const MAX_SIZE_MB = 5;

const formatSize = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB"];
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024;
    u += 1;
  }
  return `${n.toFixed(n >= 10 || u === 0 ? 0 : 1)} ${units[u]}`;
};

function NewReservationModalForm({
  open,
  onClose,
  onCreated,
  onRegistered,
  initial = null,
  rooms: roomsProp,
  createReservation: createReservationProp,
}) {
  const queryClient = useQueryClient();

  const roomsQuery = useQuery({
    queryKey: queryKeys.rooms.all,
    queryFn: async () => {
      const data = await roomsApi.getRooms();
      return data || [];
    },
    enabled: open && !roomsProp,
  });

  const internalCreateMutation = useMutation({
    mutationFn: (data) => reservationsApi.createReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });

  const rooms = roomsProp || roomsQuery.data || [];
  const createReservationMut = createReservationProp || internalCreateMutation;

  const [form, setForm] = useState(() => ({
    name: initial?.name || "",
    email: initial?.email || "",
    phone: initial?.phone || "",
    address: initial?.address || "",
    idType: initial?.idType || "Aadhaar",
    idNumber: initial?.idNumber || "",
    roomId: initial?.roomId || "",
    checkIn: initial?.checkIn || new Date().toISOString().split("T")[0],
    checkOut: initial?.checkOut || "",
    status: initial?.status || "reserved",
    purpose: initial?.purpose || "",
  }));

  const [docs, setDocs] = useState([]); // [{ file, docType }]
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectableRooms = rooms.filter((r) => {
    if (r.channelVerified === false) return false;
    if (
      initial?.roomId &&
      (r.id === initial.roomId || r._id === initial.roomId)
    ) {
      return true;
    }
    return ["available", "cleaning"].includes(r.status);
  });

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    setDocs((prev) => {
      const remaining = MAX_FILES - prev.length;
      if (remaining <= 0) {
        setFileError(`You can upload a maximum of ${MAX_FILES} documents.`);
        return prev;
      }

      const valid = [];
      let skipped = 0;

      for (const file of incoming) {
        if (valid.length >= remaining) {
          skipped += 1;
          continue;
        }
        if (!ACCEPTED_TYPES.has(file.type)) {
          skipped += 1;
          continue;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          setFileError(
            `${file.name} exceeds the ${MAX_SIZE_MB}MB limit and was skipped.`,
          );
          continue;
        }
        valid.push({ file, docType: form.idType });
      }

      if (skipped > 0) {
        setFileError(
          `Skipped ${skipped} file(s) — max ${MAX_FILES} docs, ${MAX_SIZE_MB}MB each, JPG/PNG/PDF/WEBP allowed.`,
        );
      } else if (valid.length > 0) {
        setFileError("");
      }

      return [...prev, ...valid];
    });
  };

  const handleFiles = (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const setDocType = (idx, docType) => {
    setDocs((prev) => prev.map((d, i) => (i === idx ? { ...d, docType } : d)));
  };

  const removeDoc = (idx) => {
    setDocs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSuccess = (result) => {
    onCreated?.(result);
    onRegistered?.(result);
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
      const payload = {
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
        purpose: form.purpose.trim(),
        docTypes: docs.map((d) => d.docType),
        files: docs.map((d) => d.file),
      };

      const result = await createReservationMut.mutateAsync(payload);

      if (result?.credentials) {
        setCredentials(result.credentials);
        handleSuccess(result);
      } else {
        handleSuccess(result);
        onClose?.();
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        credentials
          ? "Reservation Created!"
          : initial?.roomNumber
            ? `New Reservation (Room ${initial.roomNumber})`
            : "New Reservation"
      }
      subtitle={
        credentials
          ? "Guest portal credentials generated successfully."
          : "Book a room for an upcoming or walk-in guest."
      }
      maxWidth="xl"
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
                onClose?.();
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
                className="text-brand-900 mb-1.5 block text-sm font-semibold"
              >
                Reservation Status
              </label>
              <select
                id="res-status"
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition outline-none focus:ring-2"
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
              className="text-brand-900 mb-1.5 block text-sm font-semibold"
            >
              Assign Room *
            </label>
            <select
              id="res-room"
              value={form.roomId}
              onChange={(e) => setField("roomId", e.target.value)}
              disabled={Boolean(initial?.roomId)}
              className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500"
              required
            >
              <option value="">Select an available room...</option>
              {selectableRooms.map((r) => (
                <option key={r.id || r._id} value={r.id || r._id}>
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
                className="text-brand-900 mb-1.5 block text-sm font-semibold"
              >
                Government ID Type
              </label>
              <select
                id="res-idType"
                value={form.idType}
                onChange={(e) => setField("idType", e.target.value)}
                className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition outline-none focus:ring-2"
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

          <div className="mb-4">
            <label
              htmlFor="res-purpose"
              className="text-brand-900 mb-1.5 block text-sm font-semibold"
            >
              Purpose of Stay
            </label>
            <textarea
              id="res-purpose"
              name="purpose"
              placeholder="e.g. Business trip, Family vacation, Medical treatment, etc."
              value={form.purpose}
              onChange={(e) => setField("purpose", e.target.value)}
              rows={3}
              className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 w-full resize-none rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition outline-none focus:ring-2"
            />
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <label
              htmlFor="res-file-upload"
              className="text-brand-900 block text-sm font-semibold"
            >
              Identity Documents (Optional)
            </label>

            <label
              htmlFor="res-file-upload"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
                docs.length >= MAX_FILES || createReservationMut.isPending
                  ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                  : isDragging
                    ? "border-primary-500 bg-primary-50/60"
                    : "hover:border-primary-400 hover:bg-primary-50/40 border-gray-300 bg-gray-50/50",
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-6 w-6 text-gray-400"
              >
                <path d="M12 16V4" />
                <path d="m6 10 6-6 6 6" />
                <path d="M4 20h16" />
              </svg>
              <span className="text-sm font-medium text-gray-600">
                Click to choose or drop files here
              </span>
              <span className="text-xs text-gray-400">
                JPG · PNG · PDF · WEBP — up to 5MB each
              </span>
              <span
                className={cn(
                  "mt-0.5 text-xs font-semibold",
                  docs.length >= MAX_FILES ? "text-amber-600" : "text-gray-500",
                )}
              >
                {docs.length} / {MAX_FILES} uploaded
              </span>
              <input
                id="res-file-upload"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="hidden"
                onChange={handleFiles}
                disabled={
                  docs.length >= MAX_FILES || createReservationMut.isPending
                }
              />
            </label>

            {fileError && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {fileError}
              </div>
            )}

            {docs.length > 0 && (
              <ul className="mt-2 space-y-2">
                {docs.map((d, idx) => (
                  <li
                    key={`${d.file.name}-${d.file.size}-${d.file.lastModified || idx}`}
                    className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-gray-700">
                        {d.file.name}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {formatSize(d.file.size)}
                      </span>
                    </span>
                    <select
                      value={d.docType}
                      onChange={(e) => setDocType(idx, e.target.value)}
                      disabled={createReservationMut.isPending}
                      className="text-brand-900 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none"
                    >
                      {ID_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeDoc(idx)}
                      disabled={createReservationMut.isPending}
                      className="cursor-pointer rounded-md px-1.5 py-0.5 text-base leading-none text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${d.file.name}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
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

/**
 * Modal dialog for booking new reservations or walk-in guest check-ins.
 * Supports guest profile details, room assignment, date selection, drag-and-drop ID document upload,
 * and displays guest portal access credentials upon successful creation.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} [props.open=false] - Controls whether the modal is visible.
 * @param {() => void} props.onClose - Callback triggered when the modal is closed or cancelled.
 * @param {(reservation: Object) => void} [props.onCreated] - Callback invoked after a reservation is successfully created.
 * @param {(reservation: Object) => void} [props.onRegistered] - Callback alias for onCreated.
 * @param {Object} [props.initial=null] - Optional prefilled form data (e.g. { roomId, roomNumber, status }).
 * @param {Array<Object>} [props.rooms] - Optional list of available rooms; fetches internally if omitted.
 * @param {Object} [props.createReservation] - Optional mutation object for creating reservations; uses internal mutation if omitted.
 * @returns {React.ReactElement | null} The rendered reservation creation modal.
 */
export function NewReservationModal({
  open = false,
  onClose,
  initial = null,
  ...props
}) {
  if (!open) return null;

  return (
    <NewReservationModalForm
      key={`${initial?.roomId || ""}-${initial?.status || ""}`}
      open={open}
      onClose={onClose}
      initial={initial}
      {...props}
    />
  );
}

export default NewReservationModal;
