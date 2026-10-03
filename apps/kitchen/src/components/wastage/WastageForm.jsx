import { useState, useEffect } from "react";
import { FiTrash2 } from "react-icons/fi";
import FormField from "../ui/FormField.jsx";
import API_BASE_URL from "../../config/api.js";

const REASON_OPTIONS = [
  { value: "EXPIRED", label: "Expired" },
  { value: "SPOILED", label: "Spoiled" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "OVERPRODUCTION", label: "Overproduction" },
  { value: "BURNT", label: "Burnt" },
  { value: "DROPPED", label: "Dropped" },
  { value: "UNKNOWN", label: "Unknown" },
];

const DEPARTMENT_OPTIONS = [
  { value: "Kitchen", label: "Kitchen" },
  { value: "Prep Area", label: "Prep Area" },
  { value: "Storage", label: "Storage" },
  { value: "Bar", label: "Bar" },
];

const emptyForm = {
  inventoryItemId: "",
  batchNumber: "",
  quantity: "",
  unit: "kg",
  reason: "",
  department: "",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
};

const WastageForm = ({ editingRecord, onSaved, onCancelEdit }) => {
  const [form, setForm] = useState(emptyForm);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(editingRecord);

  useEffect(() => {
    fetch(`${API_BASE_URL}/inventory/items`)
      .then((res) => res.json())
      .then((data) => setInventoryItems(data.data || []))
      .catch((err) => console.error("Failed to load items:", err));
  }, []);

  useEffect(() => {
    if (editingRecord) {
      setForm({
        inventoryItemId: editingRecord.inventoryItem,
        batchNumber: editingRecord.batchNumber || "",
        quantity: editingRecord.quantity,
        unit: editingRecord.unit,
        reason: editingRecord.reason,
        department: editingRecord.department,
        date: editingRecord.date?.slice(0, 10) || "",
        notes: editingRecord.notes || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingRecord]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setForm(emptyForm);
    onCancelEdit?.();
  };

  const handleSubmit = async () => {
    if (
      !form.inventoryItemId ||
      !form.quantity ||
      !form.reason ||
      !form.department
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const url = isEditing
        ? `${API_BASE_URL}/inventory/wastage/${editingRecord._id}`
        : `${API_BASE_URL}/inventory`;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save wastage record");
      }

      setForm(emptyForm);
      onSaved?.();
    } catch (error) {
      console.error("Save wastage error:", error);
      alert(error.message || "Failed to save wastage record.");
    } finally {
      setSubmitting(false);
    }
  };

  const itemOptions = inventoryItems.map((item) => ({
    value: item._id,
    label: item.name,
  }));

  return (
    <div className="bg-slate rounded-xl border border-gray-800/70 p-5">
      <h2 className="text-base font-semibold text-white">
        {isEditing ? "Edit Wastage Record" : "Record Wastage"}
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Item"
          name="inventoryItemId"
          type="select"
          value={form.inventoryItemId}
          onChange={handleChange}
          options={itemOptions}
          required
        />

        <FormField
          label="Batch (Optional)"
          name="batchNumber"
          value={form.batchNumber}
          onChange={handleChange}
          placeholder="e.g. TOM-2026-001"
        />

        <FormField
          label="Quantity"
          name="quantity"
          type="number"
          value={form.quantity}
          onChange={handleChange}
          required
        />

        <FormField
          label="Reason"
          name="reason"
          type="select"
          value={form.reason}
          onChange={handleChange}
          options={REASON_OPTIONS}
          required
        />

        <FormField
          label="Date"
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          required
        />

        <FormField
          label="Department"
          name="department"
          type="select"
          value={form.department}
          onChange={handleChange}
          options={DEPARTMENT_OPTIONS}
          required
        />
      </div>

      <div className="mt-4">
        <FormField
          label="Notes"
          name="notes"
          type="textarea"
          value={form.notes}
          onChange={handleChange}
          maxLength={200}
          placeholder="Add notes about the wastage (optional)..."
        />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800"
        >
          {isEditing ? "Cancel" : "Clear"}
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition disabled:opacity-50"
        >
          <FiTrash2 size={14} />
          {submitting
            ? "Saving..."
            : isEditing
              ? "Update Record"
              : "Record Wastage"}
        </button>
      </div>
    </div>
  );
};

export default WastageForm;
