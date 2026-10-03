import { FiCalendar, FiFileText, FiPlus } from "react-icons/fi";
import FormField from "../ui/FormField";

const SingleItem = ({
  inventoryItems,
  formData,
  setFormData,
  handleAddToList,
  editingId,
  handleClear,
}) => {
  const selectedItem = inventoryItems.find(
    (item) => item._id === formData.inventoryItemId,
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const availableStock = selectedItem?.currentStock ?? 0;

  return (
    <form onSubmit={handleAddToList}>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <FormField
            label="Item"
            name="inventoryItemId"
            type="select"
            value={formData.inventoryItemId}
            onChange={handleChange}
            required
            options={inventoryItems.map((item) => ({
              value: item._id,
              label: item.name,
            }))}
          />

          {selectedItem && (
            <p className="mt-1.5 text-[11px] text-gray-500">
              Category: {selectedItem.category}
              <span className="mx-1">|</span>
              Unit: {selectedItem.unit}
            </p>
          )}
        </div>

        <div>
          <FormField
            label="Quantity"
            name="quantityUsed"
            type="number"
            value={formData.quantityUsed}
            onChange={handleChange}
            placeholder="Enter quantity"
            required
          />

          {selectedItem && (
            <p className="mt-1.5 text-[11px] text-gray-500">
              Available:{" "}
              <span className="text-emerald-400">
                {availableStock} {selectedItem.unit}
              </span>
            </p>
          )}
        </div>

        <FormField
          label="Reason"
          name="usageType"
          type="select"
          value={formData.usageType}
          onChange={handleChange}
          required
          options={[
            { value: "Kitchen Usage", label: "Kitchen Usage" },
            {
              value: "Recipe Preparation",
              label: "Recipe Preparation",
            },
            { value: "Wastage", label: "Wastage" },
            { value: "Other", label: "Other" },
          ]}
        />

        <FormField
          label="Department"
          name="department"
          type="select"
          value={formData.department}
          onChange={handleChange}
          options={[
            { value: "Kitchen", label: "Kitchen" },
            { value: "Prep", label: "Prep" },
            { value: "Bakery", label: "Bakery" },
            { value: "Bar", label: "Bar" },
            { value: "Other", label: "Other" },
          ]}
        />

        <FormField
          label="Reference"
          type="text"
          name="reference"
          value={formData.reference}
          onChange={handleChange}
          placeholder="Order #1024"
          icon={FiFileText}
        />

        <FormField
          label="Date"
          type="date"
          name="usedDate"
          value={formData.usedDate}
          onChange={handleChange}
          icon={FiCalendar}
        />

        <div className="col-span-3">
          <label className="mb-1.5 block text-xs font-medium text-gray-300">
            Notes
          </label>

          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            maxLength={200}
            rows={2}
            placeholder="Add any additional notes (optional)..."
            className="w-full resize-none rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600"
          />

          <div className="mt-1 text-right text-[10px] text-gray-600">
            {formData.notes.length}/200
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-gray-700 px-5 py-2 text-xs font-medium text-gray-300 transition hover:border-gray-600 hover:text-white"
        >
          Clear
        </button>

        <button
          type="submit"
          className="hover:bg-white-300 flex items-center gap-2 rounded-lg bg-emerald-400 px-5 py-2 text-xs font-semibold text-black transition"
        >
          <FiPlus size={15} />
          {editingId ? "Update List" : "Add to List"}
        </button>
      </div>
    </form>
  );
};

export default SingleItem;
