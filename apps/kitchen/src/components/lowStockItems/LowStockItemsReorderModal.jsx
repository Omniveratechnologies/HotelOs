import { useState } from "react";
import { FiX } from "react-icons/fi";
import API_BASE_URL from "../../config/api";

const LowStockItemsReorderModal = ({ item, onClose }) => {
  const [quantity, setQuantity] = useState(item?.reorderQuantity || 0);

  if (!item) return null;

  const totalCost = Number(quantity || 0) * Number(item.costPerUnit || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const orderQuantity = Number(quantity);
      const unitCost = Number(item.costPerUnit || 0);
      const totalCost = orderQuantity * unitCost;

      if (!orderQuantity || orderQuantity <= 0) {
        throw new Error("Invalid order quantity");
      }

      const response = await fetch(`${API_BASE_URL}/inventory/receive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventoryItemId: item._id,
          quantityReceived: orderQuantity,
          unitCost,
          totalCost,
          unit: item.unit,
          category: item.category,
          supplierName: "Low Stock Reorder",
          batchNumber: `REORDER-${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reorder item");
      }

      console.log("Reorder successful:", data);

      onClose(true);
    } catch (error) {
      console.error("Reorder error:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-[#111111] shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Reorder Item</h2>

            <p className="mt-1 text-xs text-gray-500">
              Create a reorder request for this item
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div className="rounded-lg border border-gray-800 bg-[#0f0f0f] p-4">
            <p className="text-xs text-gray-500">Item</p>

            <p className="mt-1 text-sm font-semibold text-white">{item.name}</p>

            <p className="mt-1 text-xs text-gray-500">{item.category}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Current Stock</p>

              <p className="mt-1 text-sm text-white">
                {item.currentStock} {item.unit}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Recommended Quantity</p>

              <p className="mt-1 text-sm font-medium text-yellow-400">
                {item.reorderQuantity} {item.unit}
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400">
              Order Quantity
              <span className="ml-1 text-red-400">*</span>
            </label>

            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="focus:border-white-400 w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none"
              />

              <span className="text-sm text-gray-500">{item.unit}</span>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500">Cost Per Unit</p>

            <p className="mt-1 text-sm text-white">
              ₹{Number(item.costPerUnit || 0).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Estimated Total</span>

              <span className="text-base font-semibold text-emerald-400">
                ₹{totalCost.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-700 px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-gray-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="hover:bg-white-400 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-black transition"
            >
              Confirm Reorder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LowStockItemsReorderModal;
