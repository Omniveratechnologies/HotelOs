import { useMemo, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

const LowStockItemsFilterCard = ({
  items = [],
  purchaseHistory = [],
  filterValues,
  onApply,
  onClear,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState(filterValues);

  const supplierOptions = useMemo(() => {
    const supplierMap = new Map();

    purchaseHistory.forEach((purchase) => {
      const itemId = purchase.inventoryItem?._id || purchase.inventoryItem;

      const supplier = purchase.supplierName;

      if (itemId && supplier && !supplierMap.has(itemId)) {
        supplierMap.set(itemId, supplier);
      }
    });

    return [...new Set(supplierMap.values())];
  }, [purchaseHistory]);

  const statusCounts = {
    critical: items.filter((item) => item.status === "CRITICAL").length,

    low: items.filter((item) => item.status === "LOW").length,

    outOfStock: items.filter((item) => item.status === "OUT OF STOCK").length,
  };

  const categoryOptions = [
    ...new Set(items.map((item) => item.category).filter(Boolean)),
  ];

  const handleStatusChange = (status) => {
    setLocalFilters((prev) => ({
      ...prev,
      statuses: {
        ...prev.statuses,
        [status]: !prev.statuses[status],
      },
    }));
  };

  const handleChange = (name, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClear = () => {
    const clearedFilters = {
      statuses: {
        critical: true,
        low: true,
        outOfStock: true,
      },
      category: "all",
      supplier: "all",
      sortBy: "currentStockAsc",
    };

    setLocalFilters(clearedFilters);
    onClear(clearedFilters);
  };

  const handleApply = () => {
    onApply(localFilters);

    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="w-full rounded-xl border border-gray-800 bg-[#111111] p-4 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Filter & Sort</h3>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="text-[11px] font-medium text-sky-400 hover:text-sky-300"
        >
          Clear All
        </button>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium text-gray-400">Status</p>

        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={localFilters.statuses.critical}
              onChange={() => handleStatusChange("critical")}
              className="peer sr-only"
            />

            <span
              className={`flex h-4 w-4 items-center justify-center rounded border ${
                localFilters.statuses.critical
                  ? "border-emerald-400 bg-emerald-400 text-black"
                  : "border-gray-600 bg-transparent"
              }`}
            >
              {localFilters.statuses.critical && <FiCheck size={11} />}
            </span>

            <span className="text-xs text-gray-300">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-red-400" />
              Critical ({statusCounts.critical})
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={localFilters.statuses.low}
              onChange={() => handleStatusChange("low")}
              className="peer sr-only"
            />

            <span
              className={`flex h-4 w-4 items-center justify-center rounded border ${
                localFilters.statuses.low
                  ? "border-emerald-400 bg-emerald-400 text-black"
                  : "border-gray-600 bg-transparent"
              }`}
            >
              {localFilters.statuses.low && <FiCheck size={11} />}
            </span>

            <span className="text-xs text-gray-300">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" />
              Low Stock ({statusCounts.low})
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={localFilters.statuses.outOfStock}
              onChange={() => handleStatusChange("outOfStock")}
              className="peer sr-only"
            />

            <span
              className={`flex h-4 w-4 items-center justify-center rounded border ${
                localFilters.statuses.outOfStock
                  ? "border-emerald-400 bg-emerald-400 text-black"
                  : "border-gray-600 bg-transparent"
              }`}
            >
              {localFilters.statuses.outOfStock && <FiCheck size={11} />}
            </span>

            <span className="text-xs text-gray-300">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
              Out of Stock ({statusCounts.outOfStock})
            </span>
          </label>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[11px] font-medium text-gray-400">
          Category
        </label>

        <div className="relative">
          <select
            value={localFilters.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className="w-full appearance-none rounded-md border border-gray-800 bg-[#151515] px-3 py-2 pr-8 text-xs text-gray-300 outline-none"
          >
            <option value="all">All Categories</option>

            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <FiChevronDown
            size={14}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[11px] font-medium text-gray-400">
          Supplier
        </label>

        <div className="relative">
          <select
            value={localFilters.supplier}
            onChange={(e) => handleChange("supplier", e.target.value)}
            className="w-full appearance-none rounded-md border border-gray-800 bg-[#151515] px-3 py-2 pr-8 text-xs text-gray-300 outline-none"
          >
            <option value="all">All Suppliers</option>

            {supplierOptions.map((supplier) => (
              <option key={supplier} value={supplier}>
                {supplier}
              </option>
            ))}
          </select>

          <FiChevronDown
            size={14}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[11px] font-medium text-gray-400">
          Sort By
        </label>

        <div className="relative">
          <select
            value={localFilters.sortBy}
            onChange={(e) => handleChange("sortBy", e.target.value)}
            className="w-full appearance-none rounded-md border border-gray-800 bg-[#151515] px-3 py-2 pr-8 text-xs text-gray-300 outline-none"
          >
            <option value="currentStockAsc">Current Stock (Low to High)</option>

            <option value="currentStockDesc">
              Current Stock (High to Low)
            </option>

            <option value="reorderQuantityDesc">
              Recommended Qty (High to Low)
            </option>

            <option value="reorderQuantityAsc">
              Recommended Qty (Low to High)
            </option>
          </select>

          <FiChevronDown
            size={14}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleApply}
        className="hover:bg-white-300 mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-xs font-semibold text-black transition"
      >
        <FiCheck size={14} />
        Apply Filters
      </button>
    </div>
  );
};

export default LowStockItemsFilterCard;
