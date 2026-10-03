import { FiX } from "react-icons/fi";
import StatusBadge from "../ui/StatusBadge.jsx";

const LowStockItemsViewModal = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-[#111111] shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Item Details</h2>

            <p className="mt-1 text-xs text-gray-500">Low stock information</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 px-5 py-5">
          <div>
            <p className="text-xs text-gray-500">Item</p>
            <p className="mt-1 text-sm font-medium text-white">{item.name}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Category</p>
            <p className="mt-1 text-sm text-gray-300">{item.category}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Current Stock</p>
            <p className="mt-1 text-sm font-medium text-white">
              {item.currentStock} {item.unit}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Minimum Stock</p>
            <p className="mt-1 text-sm text-gray-300">
              {item.minimumStock} {item.unit}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Recommended Order Qty</p>
            <p className="mt-1 text-sm font-medium text-yellow-400">
              {item.reorderQuantity} {item.unit}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Cost Per Unit</p>
            <p className="mt-1 text-sm text-gray-300">
              ₹{Number(item.costPerUnit || 0).toLocaleString("en-IN")}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Estimated Purchase Value</p>
            <p className="mt-1 text-sm font-medium text-emerald-400">
              ₹
              {Number(item.estimatedPurchaseValue || 0).toLocaleString("en-IN")}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Status</p>
            <div className="mt-1">
              <StatusBadge status={item.status} />
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-800 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-700 px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LowStockItemsViewModal;
