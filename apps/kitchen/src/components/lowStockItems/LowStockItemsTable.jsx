import Table from "../ui/Table.jsx";
import { FiEye, FiShoppingCart } from "react-icons/fi";

const LowStockTable = ({
  items = [],
  onReorder,
  onView,
  selectedIds = [],
  onToggleItem,
}) => {
  const columns = [
    {
      key: "select",
      label: "",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row._id)}
          onChange={() => onToggleItem(row._id)}
          className="h-4 w-4 cursor-pointer accent-emerald-400"
        />
      ),
    },

    {
      key: "serialNumber",
      label: "#",
      render: (_, index) => index + 1,
    },
    {
      key: "name",
      label: "Item",
    },
    {
      key: "category",
      label: "Category",
    },
    {
      key: "currentStock",
      label: "Current Stock",
      render: (row) => (
        <span className="font-medium text-white">
          {row.currentStock} {row.unit}
        </span>
      ),
    },
    {
      key: "minimumStock",
      label: "Minimum Stock",
      render: (row) => (
        <span>
          {row.minimumStock} {row.unit}
        </span>
      ),
    },
    {
      key: "reorderQuantity",
      label: "Recommended Order Qty",
      render: (row) => (
        <span>
          {row.reorderQuantity} {row.unit}
        </span>
      ),
    },
    {
      key: "unit",
      label: "Unit",
      render: (row) => <span>{row.unit}</span>,
    },
    {
      key: "action",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onReorder(row)}
            className="rounded-md border p-2 text-gray-400 transition hover:bg-gray-500/20"
            title="Reorder"
          >
            <FiShoppingCart size={15} />
          </button>

          <button
            type="button"
            onClick={() => onView(row)}
            className="rounded-md border p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white"
            title="View Details"
          >
            <FiEye size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={items}
      emptyMessage="No low stock items found"
    />
  );
};

export default LowStockTable;
