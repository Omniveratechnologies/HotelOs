import { useMemo } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

import Table from "../ui/Table";

const StockOutUsageTable = ({ items, handleEdit, handleRemove }) => {
  const columns = [
    {
      key: "serialNumber",
      label: "#",
      render: (_, index) => index + 1,
    },
    {
      key: "inventoryItem",
      label: "Item Name",
      render: (row) => row.inventoryItemName || "-",
    },
    {
      key: "category",
      label: "Category",
      render: (row) => row.category || "-",
    },
    {
      key: "quantityUsed",
      label: "Quantity",
      render: (row) => row.quantityUsed || "-",
    },
    {
      key: "unit",
      label: "Unit",
      render: (row) => row.unit || "-",
    },
    {
      key: "usageType",
      label: "Reason",
      render: (row) => row.usageType || "-",
    },
    {
      key: "department",
      label: "Department",
      render: (row) => row.department || "-",
    },
    {
      key: "reference",
      label: "Reference",
      render: (row) => row.reference || "-",
    },
    {
      key: "action",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleEdit(row)}
            className="rounded-md border border-gray-700 p-1.5 text-gray-400 transition"
          >
            <FiEdit2 size={14} />
          </button>

          <button
            type="button"
            onClick={() => handleRemove(row.id)}
            className="rounded-md border border-gray-700 p-1.5 text-gray-400 transition hover:border-red-500 hover:text-red-400"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const totalItems = items.length;

  const totalQuantity = useMemo(() => {
    return items.reduce(
      (total, item) => total + Number(item.quantityUsed || 0),
      0,
    );
  }, [items]);

  return (
    <div className="rounded-xl border border-gray-800 bg-[#081923] p-3">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-white">Items to be Issued</h2>

        <span className="rounded-full bg-emerald-950 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
          {totalItems} items
        </span>
      </div>

      <Table columns={columns} data={items} />

      <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-800 bg-[#0b1d29] px-4 py-3 text-xs">
        <span className="text-gray-400">
          Total Items:
          <span className="ml-1 font-semibold text-emerald-400">
            {totalItems}
          </span>
        </span>

        <span className="text-gray-400">
          Total Quantity:
          <span className="ml-1 font-semibold text-emerald-400">
            {totalQuantity}
          </span>
        </span>
      </div>
    </div>
  );
};

export default StockOutUsageTable;
