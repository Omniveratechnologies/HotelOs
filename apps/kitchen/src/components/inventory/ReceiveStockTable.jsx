import { useMemo } from "react";
import { FiPackage, FiEdit2, FiTrash2 } from "react-icons/fi";

import Table from "../ui/Table";

const ReceiveStockTable = ({ items, handleEdit, handleRemove }) => {
  const columns = [
    {
      key: "serialNumber",
      label: "#",
      render: (row, index) => index + 1,
    },
    {
      key: "inventoryItem",
      label: "Item Name",
      render: (row) => row.inventoryItem || "-",
    },
    {
      key: "category",
      label: "Category",
      render: (row) => row.category || "-",
    },
    {
      key: "quantity",
      label: "Quantity",
      render: (row) => row.quantity || "-",
    },
    {
      key: "unit",
      label: "Unit",
      render: (row) => row.unit || "-",
    },
    {
      key: "unitCost",
      label: "Unit Cost (₹)",
      render: (row) => `₹${row.unitCost}`,
    },
    {
      key: "totalCost",
      label: "Total (₹)",
      render: (row) => (
        <span className="font-semibold text-white">
          ₹{row.totalCost.toLocaleString("en-IN")}
        </span>
      ),
    },

    {
      key: "batchNumber",
      label: "Batch",
      render: (row) => row.batchNumber || "-",
    },

    {
      key: "expiryDate",
      label: "Expiry Date",
      render: (row) => row.expiryDate || "-",
    },

    {
      key: "action",
      label: "Action",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleEdit(row)}
            className="hover:bg-white-500/10 flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition"
            title="Edit"
          >
            <FiEdit2 size={16} />
          </button>

          <button
            type="button"
            onClick={() => handleRemove(row.id)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-500/10 hover:text-red-500"
            title="Remove"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const totalCost = useMemo(() => {
    return items.reduce((total, item) => total + item.totalCost, 0);
  }, [items]);
  return (
    <div className="mt-6 rounded-2xl border border-gray-800 bg-[#0f0f0f] p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Items to Receive</h2>

          <p className="mt-1 text-sm text-gray-400">
            {items.length} item{items.length !== 1 ? "s" : ""} added
          </p>
        </div>

        <div className="text-right">
          <p className="text-gray-400">Total Cost</p>

          <p className="text-xl font-semibold text-emerald-500">
            ₹{totalCost.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 px-6 py-12 text-center">
          <FiPackage className="mx-auto mb-3 text-gray-500" size={34} />

          <p className="text-sm font-medium text-white">No items added yet</p>

          <p className="mt-1 text-xs text-gray-500">
            Add stock details using the form above
          </p>
        </div>
      ) : (
        <Table
          columns={columns}
          data={items}
          emptyMessage="No items added yet"
        />
      )}
    </div>
  );
};

export default ReceiveStockTable;
