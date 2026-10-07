import React, { useState } from "react";
import { Modal, Input, Button } from "@hotelos/ui/components";

function cleanField(val) {
  if (!val || val === "—" || val === "null" || val === "undefined") return "";
  return String(val);
}

function getInitialForm(guest) {
  return {
    name: cleanField(guest?.name),
    phone: cleanField(guest?.phone),
    email: cleanField(guest?.email),
    nationality: cleanField(guest?.nationality) || "Indian",
    address: cleanField(guest?.address),
    specialRequests: cleanField(guest?.specialRequests),
  };
}

function EditGuestModalForm({ guest, onClose, onSave }) {
  const [formData, setFormData] = useState(() => getInitialForm(guest));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Guest name is required");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to update guest details");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Full Name *"
          placeholder="e.g. John Doe"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          required
        />
        <Input
          label="Phone Number"
          placeholder="e.g. +91 98765 43210"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Email Address"
          type="email"
          placeholder="e.g. guest@example.com"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
        <Input
          label="Nationality"
          placeholder="e.g. Indian"
          value={formData.nationality}
          onChange={(e) => handleChange("nationality", e.target.value)}
        />
      </div>

      <div>
        <label
          htmlFor="guest-edit-address"
          className="mb-1 block text-xs font-semibold text-gray-700"
        >
          Address / City
        </label>
        <textarea
          id="guest-edit-address"
          rows={2}
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="Enter guest residential address"
          className="focus:border-brand-500 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="guest-edit-requests"
          className="mb-1 block text-xs font-semibold text-gray-700"
        >
          Special Requests & Notes
        </label>
        <textarea
          id="guest-edit-requests"
          rows={2}
          value={formData.specialRequests}
          onChange={(e) => handleChange("specialRequests", e.target.value)}
          placeholder="Late checkout, high floor preference, dietary..."
          className="focus:border-brand-500 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none"
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-3">
        <Button
          variant="secondary"
          type="button"
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Guest Details"}
        </Button>
      </div>
    </form>
  );
}

export default function EditGuestModal({ open, onClose, guest, onSave }) {
  if (!open || !guest) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Guest Details"
      subtitle={`Update guest profile and stay notes for #${guest.bookingNo}`}
      maxWidth="lg"
    >
      <EditGuestModalForm
        key={guest.id || guest.guestId}
        guest={guest}
        onClose={onClose}
        onSave={onSave}
      />
    </Modal>
  );
}
