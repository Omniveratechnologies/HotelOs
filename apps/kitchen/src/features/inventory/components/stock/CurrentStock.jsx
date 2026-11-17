import { useState } from "react";
import { FiX } from "react-icons/fi";

const CurrentStock = ({ item }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!item) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[#0b1117] p-4">
        <h3 className="text-sm font-semibold text-white">Current Stock</h3>

        <p className="mt-6 text-center text-xs text-gray-500">
          Select an inventory item
        </p>
      </div>
    );
  }

  const isLowStock = item.currentStock <= item.minimumStock;

  return (
    <>
      <div className="rounded-xl border border-gray-800 bg-[#0b1117] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Current Stock</h3>

          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="hover:text-white-300 text-[10px] font-medium text-emerald-400 transition"
          >
            View Details
          </button>

          <span
            className={`rounded-full px-2 py-1 text-[10px] font-medium ${
              isLowStock
                ? "bg-red-950 text-red-400"
                : "bg-emerald-950 text-emerald-400"
            }`}
          >
            {isLowStock ? "Low Stock" : "In Stock"}
          </span>
        </div>

        <div className="mt-5">
          <p className="text-xs text-gray-500">{item.category}</p>

          <h4 className="mt-1 text-base font-semibold text-white">
            {item.name}
          </h4>

          <div className="mt-4 flex items-end gap-2">
            <span className="text-3xl font-bold text-emerald-400">
              {item.currentStock}
            </span>

            <span className="mb-1 text-xs text-gray-400">{item.unit}</span>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Minimum stock: {item.minimumStock} {item.unit}
          </p>
        </div>
      </div>

      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-[#0b1117] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Item Details</h3>

              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="text-gray-500 transition hover:text-white"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <Detail label="Item Name" value={item.name} />
              <Detail label="Category" value={item.category} />
              <Detail
                label="Current Stock"
                value={`${item.currentStock} ${item.unit}`}
              />
              <Detail
                label="Minimum Stock"
                value={`${item.minimumStock} ${item.unit}`}
              />
              <Detail label="Unit" value={item.unit} />

              <Detail
                label="Status"
                value={isLowStock ? "Low Stock" : "In Stock"}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Detail = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between border-b border-gray-800 pb-3">
      <span className="text-xs text-gray-500">{label}</span>

      <span className="text-xs font-medium text-gray-200">{value}</span>
    </div>
  );
};

export default CurrentStock;
