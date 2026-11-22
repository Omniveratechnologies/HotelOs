import React, { useState } from "react";
import { Modal, Input, Button } from "@hotelos/ui/components";
import { updateGuest } from "@hotelos/api";

const ID_TYPES = [
  "Aadhaar",
  "Passport",
  "Driving License",
  "Voter ID",
  "PAN",
  "Other",
];

function cleanField(val) {
  if (!val || val === "—" || val === "null" || val === "undefined") return "";
  return String(val);
}

function EditGuestForm({ guest, onClose, onSaved }) {
  const guestId = guest.id || guest._id || guest.guestId;

  const [form, setForm] = useState(() => ({
    name: cleanField(guest.name),
    email: cleanField(guest.email),
    phone: cleanField(guest.phone),
    address: cleanField(guest.address),
    idType: cleanField(guest.idType) || "Aadhaar",
    idNumber: cleanField(guest.idNumber),
    nationality: cleanField(guest.nationality) || "Indian",
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Guest full name is required.");
      return;
    }

    try {
      setSaving(true);
      await updateGuest(guestId, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        idType: form.idType,
        idNumber: form.idNumber.trim(),
        nationality: form.nationality.trim(),
      });
      onSaved?.({
        ...guest,
        ...form,
      });
      onClose();
    } catch (err) {
      console.error("Failed to update guest:", err);
      setError(err?.message || "Failed to update guest profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title="Edit Guest Profile"
      description={`Update contact and identity information for ${guest.name || "guest"}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="col-span-full">
            <Input
              label="Full Legal Name *"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. John Doe"
              required
              disabled={saving}
            />
          </div>

          <Input
            label="Phone Number"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="e.g. +91 98765 43210"
            disabled={saving}
          />

          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="e.g. guest@example.com"
            disabled={saving}
          />

          <div>
            <label className="mb-1 block font-semibold text-gray-700">
              ID Document Type
            </label>
            <select
              value={form.idType}
              onChange={(e) => setField("idType", e.target.value)}
              disabled={saving}
              className="focus:border-brand-500 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium outline-none"
            >
              {ID_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="ID Document Number"
            value={form.idNumber}
            onChange={(e) => setField("idNumber", e.target.value)}
            placeholder="e.g. 1234 5678 9012"
            disabled={saving}
          />

          <div className="col-span-full">
            <Input
              label="Nationality"
              value={form.nationality}
              onChange={(e) => setField("nationality", e.target.value)}
              placeholder="e.g. Indian"
              disabled={saving}
            />
          </div>

          <div className="col-span-full">
            <label className="mb-1 block font-semibold text-gray-700">
              Residential Address / City
            </label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="Enter guest permanent or home address"
              disabled={saving}
              className="focus:border-brand-500 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving Changes..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function EditGuestModal({ open, onClose, guest, onSaved }) {
  if (!guest) return null;
  const guestKey = guest.id || guest._id || guest.guestId || "edit";
  return (
    <EditGuestForm
      key={guestKey}
      open={open}
      guest={guest}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
