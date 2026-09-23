import { useState } from "react";
import Modal from "../../../components/ui/Modal.jsx";
import Button from "../../../components/ui/Button.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { useUpdateGuest } from "../hooks/useGuests.js";
import { getDocumentUploadUrls, uploadToR2 } from "@hotelos/api";

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

export default function EditGuestModal({ open, onClose, guest, onSaved }) {
  const updateGuestMut = useUpdateGuest();

  const [prevId, setPrevId] = useState(guest?.id);
  const [form, setForm] = useState(() => ({
    name: guest?.name || "",
    email: guest?.email || "",
    phone: guest?.phone || "",
    address: guest?.address || "",
    idType: guest?.idType || "Aadhaar",
    idNumber: guest?.idNumber || "",
  }));

  const [newDocs, setNewDocs] = useState([]);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [saving, setSaving] = useState(false);

  if (guest?.id !== prevId) {
    setPrevId(guest?.id);
    setForm({
      name: guest?.name || "",
      email: guest?.email || "",
      phone: guest?.phone || "",
      address: guest?.address || "",
      idType: guest?.idType || "Aadhaar",
      idNumber: guest?.idNumber || "",
    });
    setNewDocs([]);
    setError("");
    setFileError("");
  }

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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
    setNewDocs((prev) => [...prev, ...valid]);
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guest) return;
    setError("");

    if (!form.name.trim()) return setError("Name is required.");
    if (!form.email.trim()) return setError("Email is required.");

    setSaving(true);
    try {
      let documentsPayload = undefined;

      if (newDocs.length > 0) {
        const uploads = await getDocumentUploadUrls(
          newDocs.map((d) => ({
            filename: d.file.name,
            size: d.file.size,
            mimeType: d.file.type,
            docType: d.docType,
          })),
        );

        await Promise.all(
          uploads.map((upload, index) =>
            uploadToR2(upload.uploadUrl, newDocs[index].file),
          ),
        );

        documentsPayload = uploads.map((u) => ({
          key: u.key,
          filename: u.filename,
          docType: u.docType,
          mimeType: u.mimeType,
          size: u.size,
        }));
      }

      await updateGuestMut.mutateAsync({
        guestId: guest.id || guest._id,
        updates: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          idType: form.idType,
          idNumber: form.idNumber.trim(),
          ...(documentsPayload ? { documents: documentsPayload } : {}),
        },
      });

      onSaved?.();
      onClose();
    } catch (err) {
      console.error("Update guest error:", err);
      setError(err.message || "Failed to update guest details.");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !guest) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Guest Details"
      subtitle={`Editing profile for ${guest.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Full Name *"
            name="name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            required
          />
          <Input
            label="Email Address *"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Phone Number"
            name="phone"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
          />
          <div className="mb-4">
            <label
              htmlFor="edit-guest-idType"
              className="text-brand-900 mb-2 block text-sm font-medium"
            >
              Government ID Type
            </label>
            <select
              id="edit-guest-idType"
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
        </div>

        <Input
          label="ID Document Number"
          name="idNumber"
          value={form.idNumber}
          onChange={(e) => setField("idNumber", e.target.value)}
        />

        <Input
          label="Residential Address"
          name="address"
          value={form.address}
          onChange={(e) => setField("address", e.target.value)}
        />

        {/* Upload Additional Documents */}
        <div className="space-y-2">
          <label
            htmlFor="edit-guest-docs"
            className="text-brand-900 block text-sm font-medium"
          >
            Attach Additional Documents
          </label>
          <div className="flex items-center gap-3">
            <label
              htmlFor="edit-guest-docs"
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
              Upload Document
              <input
                id="edit-guest-docs"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={handleFiles}
              />
            </label>
            <span className="text-xs text-gray-400">
              PDF or images up to 5MB
            </span>
          </div>

          {fileError && <p className="text-xs text-red-500">{fileError}</p>}

          {newDocs.length > 0 && (
            <div className="space-y-1.5 pt-2">
              {newDocs.map((d, idx) => (
                <div
                  key={`${d.file.name}-${d.file.size}-${d.file.lastModified || idx}`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs"
                >
                  <span className="truncate font-medium text-gray-700">
                    📄 {d.file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setNewDocs((prev) => prev.filter((_, i) => i !== idx))
                    }
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
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
