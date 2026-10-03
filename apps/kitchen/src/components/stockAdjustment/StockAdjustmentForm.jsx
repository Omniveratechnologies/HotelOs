import { useState } from "react";
import FormField from "../ui/FormField.jsx";
import StockAdjustmentDifference from "./StockAdjustmentDifference.jsx";

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const initialForm = {
  inventoryItemId: "",
  physicalStock: "",
  reason: "Physical Count",
  adjustmentDate: getToday(),
  notes: "",
};

const reasonOptions = [
  { value: "Physical Count", label: "Physical Count" },
  { value: "Damaged Stock", label: "Damaged Stock" },
  { value: "Expired Stock", label: "Expired Stock" },
  { value: "Stock Correction", label: "Stock Correction" },
  { value: "Other", label: "Other" },
];
const EMPTY_ARRAY = [];
const StockAdjustmentForm = ({ inventoryItems = EMPTY_ARRAY, onSubmit }) => {
  const [form, setForm] = useState(initialForm);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const selectedItem = inventoryItems.find(
    (item) => item._id === form.inventoryItemId,
  );

  const currentStock = Number(selectedItem?.currentStock ?? 0);
  const unit = selectedItem?.unit ?? "";

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedItem) {
      alert("Please select an inventory item.");
      return;
    }

    if (form.physicalStock === "" || Number(form.physicalStock) < 0) {
      alert("Please enter a valid physical stock quantity.");
      return;
    }

    if (form.reason === "Other" && !form.notes.trim()) {
      alert("Please enter notes for this adjustment.");
      return;
    }

    onSubmit({
      inventoryItemId: form.inventoryItemId,
      physicalStock: Number(form.physicalStock),
      reason: form.reason,
      adjustmentDate: form.adjustmentDate,
      notes: form.notes.trim(),
    });
  };

  return (
    <form
      id="stock-adjustment-form"
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-gray-800 bg-[#171717] p-5">
          <h2 className="mb-5 text-base font-semibold text-white">
            Item Details
          </h2>

          <div className="space-y-5">
            <FormField
              label="Item"
              name="inventoryItemId"
              type="select"
              value={form.inventoryItemId}
              onChange={handleChange}
              required
              options={inventoryItems.map((item) => ({
                value: item._id,
                label: item.name ?? item.itemName,
              }))}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">
                  Current System Stock
                </label>

                <div className="flex min-h-11 items-center justify-between rounded-lg border border-gray-700 bg-gray-800/70 px-3 py-2.5 text-sm text-gray-300">
                  <span>{selectedItem ? currentStock : "—"}</span>

                  <span className="text-gray-400">
                    {selectedItem?.unit ?? ""}
                  </span>
                </div>
              </div>

              <FormField
                label="Physical Stock"
                name="physicalStock"
                type="number"
                value={form.physicalStock}
                onChange={handleChange}
                placeholder="Enter physical stock"
                required
              />

              <StockAdjustmentDifference
                currentStock={currentStock}
                physicalStock={form.physicalStock}
                unit={unit}
              />
            </div>

            {form.physicalStock !== "" &&
              Number(form.physicalStock) < currentStock && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  Physical stock is lower than system stock. Please verify the
                  quantity before confirming.
                </div>
              )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-800 bg-[#171717] p-5">
          <h2 className="mb-5 text-base font-semibold text-white">
            Adjustment Details
          </h2>

          <div className="space-y-5">
            <FormField
              label="Reason"
              name="reason"
              type="select"
              value={form.reason}
              onChange={handleChange}
              required
              options={reasonOptions}
            />

            <FormField
              label="Date"
              name="adjustmentDate"
              type="date"
              value={form.adjustmentDate}
              onChange={handleChange}
              required
            />

            <FormField
              label="Notes"
              name="notes"
              type="textarea"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add a note about this adjustment"
              maxLength={300}
            />

            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-200">
              An adjustment record will be created in the inventory
              transactions.
            </div>
          </div>
        </section>
      </div>
    </form>
  );
};

export default StockAdjustmentForm;
