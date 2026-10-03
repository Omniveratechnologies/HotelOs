import { FiCalendar, FiFileText, FiPlus, FiTrash2 } from "react-icons/fi";
import FormField from "../ui/FormField";

const MultipleItems = ({
  inventoryItems,
  formData,
  setFormData,
  handleMultipleAddToList,
  handleClear,
  setSelectedStockItemId,
}) => {
  const handleRowChange = (index, field, value) => {
    setFormData((prev) => {
      const currentRows = prev.multipleItems || [];

      const updatedRows = currentRows.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }

        if (field === "inventoryItemId") {
          const selectedItem = inventoryItems.find(
            (item) => item._id === value,
          );

          return Object.assign({}, row, {
            inventoryItemId: value,
            unit: selectedItem?.unit || "",
            category: selectedItem?.category || "",
          });
        }

        return Object.assign({}, row, {
          [field]: value,
        });
      });

      return {
        ...prev,
        multipleItems: updatedRows,
      };
    });
  };

  const handleAddRow = () => {
    setFormData((prev) => ({
      ...prev,
      multipleItems: [
        ...(prev.multipleItems || []),
        {
          id: crypto.randomUUID(),
          inventoryItemId: "",
          category: "",
          quantityUsed: "",
          unit: "",
        },
      ],
    }));
  };

  const handleRemoveRow = (index) => {
    setFormData((prev) => {
      const currentRows = prev.multipleItems || [];

      if (currentRows.length === 1) {
        return prev;
      }

      return {
        ...prev,
        multipleItems: currentRows.filter((_, rowIndex) => rowIndex !== index),
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const rows = formData.multipleItems || [];

    const validRows = rows.filter(
      (row) =>
        row.inventoryItemId && row.quantityUsed && Number(row.quantityUsed) > 0,
    );

    if (validRows.length === 0) {
      return;
    }

    handleMultipleAddToList({
      ...formData,
      items: validRows,
    });
  };

  const rows = formData.multipleItems || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <FormField
          label="Reason"
          name="usageType"
          type="select"
          value={formData.usageType}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              usageType: e.target.value,
            }))
          }
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
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              department: e.target.value,
            }))
          }
          options={[
            { value: "Kitchen", label: "Kitchen" },
            { value: "Prep", label: "Prep" },
            { value: "Bakery", label: "Bakery" },
            { value: "Bar", label: "Bar" },
            { value: "Other", label: "Other" },
          ]}
        />

        <FormField
          label="Date"
          type="date"
          name="usedDate"
          value={formData.usedDate}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              usedDate: e.target.value,
            }))
          }
          icon={FiCalendar}
          required
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-white">Items</h4>

            <p className="mt-1 text-[10px] text-gray-500">
              Add multiple inventory items
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="hover:text-white-300 flex items-center gap-1.5 text-xs font-medium text-emerald-400 transition"
          >
            <FiPlus size={14} />
            Add Item
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-800">
          <div className="grid grid-cols-[1.5fr_1fr_0.7fr_40px] gap-3 border-b border-gray-800 bg-[#0f161d] px-3 py-2.5">
            <span className="text-[10px] font-medium text-gray-500 uppercase">
              Item
            </span>

            <span className="text-[10px] font-medium text-gray-500 uppercase">
              Quantity
            </span>

            <span className="text-[10px] font-medium text-gray-500 uppercase">
              Unit
            </span>

            <span />
          </div>

          <div className="divide-y divide-gray-800">
            {rows.map((row, index) => {
              <div
                key={row.id}
                className="grid grid-cols-[1.5fr_1fr_0.7fr_40px] items-center gap-3 px-3 py-3"
              >
                <select
                  value={row.inventoryItemId}
                  onChange={(e) => {
                    const value = e.target.value;

                    handleRowChange(index, "inventoryItemId", value);

                    setSelectedStockItemId(value);
                  }}
                  className="focus:border-white-500 w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="">Select item</option>

                  {inventoryItems.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.quantityUsed}
                  onChange={(e) =>
                    handleRowChange(index, "quantityUsed", e.target.value)
                  }
                  placeholder="0"
                  className="focus:border-white-500 w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-xs text-white outline-none placeholder:text-gray-600"
                />

                <div className="rounded-lg border border-gray-800 bg-[#111820] px-3 py-2 text-xs text-gray-400">
                  {row.unit || "-"}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveRow(index)}
                  disabled={rows.length === 1}
                  className="flex items-center justify-center text-gray-500 transition hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>;
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Reference"
          type="text"
          name="reference"
          value={formData.reference}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              reference: e.target.value,
            }))
          }
          placeholder="Order #1024"
          icon={FiFileText}
        />

        <FormField
          label="Notes"
          type="text"
          name="notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              notes: e.target.value,
            }))
          }
          placeholder="Optional notes"
        />
      </div>

      <div className="flex justify-end gap-2">
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
          Add to List
        </button>
      </div>
    </form>
  );
};

export default MultipleItems;
