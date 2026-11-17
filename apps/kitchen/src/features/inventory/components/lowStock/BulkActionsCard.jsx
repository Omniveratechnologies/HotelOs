import {
  FiCheckSquare,
  FiShoppingCart,
  FiFileText,
  FiPrinter,
} from "react-icons/fi";

const BulkActionsCard = ({
  items = [],
  selectedIds = [],
  onSelectAll,
  onCreatePurchaseOrder,
  onExportExcel,
  onPrintList,
}) => {
  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.includes(item._id));

  return (
    <div className="rounded-lg border border-gray-800 bg-[#111111] p-3">
      <h3 className="mb-2 text-xs font-semibold text-white">Bulk Actions</h3>

      <div className="space-y-1">
        <button
          type="button"
          onClick={() => onSelectAll(items)}
          className="bg-slate flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[10px] font-medium text-white transition hover:bg-gray-400"
        >
          <FiCheckSquare size={13} />

          <span>{allSelected ? "Deselect All" : "Select All"}</span>
        </button>

        <button
          type="button"
          onClick={() => onCreatePurchaseOrder(selectedIds)}
          disabled={selectedIds.length === 0}
          className="bg-slate flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[10px] font-medium text-white transition hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiShoppingCart size={13} />

          <span>Create Purchase Order</span>
        </button>

        <button
          type="button"
          onClick={() => onExportExcel(items)}
          className="bg-slate flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[10px] font-medium text-white transition hover:bg-gray-400"
        >
          <FiFileText size={13} />

          <span>Export to Excel</span>
        </button>

        <button
          type="button"
          onClick={() => onPrintList(items)}
          className="bg-slate flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[10px] font-medium text-white transition hover:bg-gray-400"
        >
          <FiPrinter size={13} />

          <span>Print List</span>
        </button>
      </div>
    </div>
  );
};

export default BulkActionsCard;
