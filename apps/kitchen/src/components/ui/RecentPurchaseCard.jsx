import { useState } from "react";
import { FiArrowRight, FiX } from "react-icons/fi";
const EMPTY_ARRAY=[];
const RecentPurchaseCard = ({
  items = EMPTY_ARRAY,
  loading = false,
  type = "usage",
}) => {
  const [showAll, setShowAll] = useState(false);

  const recentItems = items.slice(0, 5);

  const isPurchase = type === "purchase";

  const title = isPurchase ? "Recent Purchase History" : "Recent Usage";

  const modalTitle = isPurchase ? "Purchase History" : "Usage History";

  const loadingText = isPurchase
    ? "Loading purchase history..."
    : "Loading usage...";

  const emptyText = isPurchase ? "No purchase history" : "No usage history";

  return (
    <>
      <div className="rounded-xl border border-gray-800 bg-[#0b1117] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{title}</h3>

          <button
            type="button"
            onClick={() => setShowAll(true)}
            disabled={items.length === 0}
            className="flex items-center gap-1 text-xs font-medium text-emerald-400 transition hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            View All
            <FiArrowRight size={13} />
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-center text-xs text-gray-500">
            {loadingText}
          </p>
        ) : recentItems.length === 0 ? (
          <p className="mt-6 text-center text-xs text-gray-500">{emptyText}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {recentItems.map((item) => (
              <HistoryRow key={item._id} item={item} type={type} />
            ))}
          </div>
        )}
      </div>

      {showAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl border border-gray-800 bg-[#0b1117] shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {modalTitle}
                </h3>

                <p className="mt-1 text-[11px] text-gray-500">
                  {isPurchase
                    ? "All recorded purchase history"
                    : "All recorded stock usage"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="text-gray-500 transition hover:text-white"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">
              {items.length === 0 ? (
                <p className="text-center text-xs text-gray-500">{emptyText}</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <HistoryRow
                      key={item._id}
                      item={item}
                      type={type}
                      detailed
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const HistoryRow = ({ item, type, detailed = false }) => {
  const isPurchase = type === "purchase";

  const itemName = item.inventoryItem?.name || item.name || "Unknown Item";

  const category = item.inventoryItem?.category || item.category || "-";

  const unit = item.unit || item.inventoryItem?.unit || "-";

  const quantity = isPurchase ? item.quantity : item.quantityUsed;

  const date = isPurchase ? item.purchaseDate : item.usedDate;

  return (
    <div className="rounded-lg border border-gray-800 bg-[#0f161d] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-white">{itemName}</p>

          <p className="mt-1 text-[10px] text-gray-500">{category}</p>
        </div>

        <p
          className={`text-xs font-semibold whitespace-nowrap ${
            isPurchase ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isPurchase ? "+" : "-"}
          {quantity} {unit}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500">
        {isPurchase ? (
          <>
            {item.supplierName && <span>{item.supplierName}</span>}

            {item.costUnit !== undefined && (
              <span>
                ₹{item.costUnit}/{unit}
              </span>
            )}

            {item.totalCost !== undefined && <span>₹{item.totalCost}</span>}

            {item.batchNumber && <span>Batch: {item.batchNumber}</span>}
          </>
        ) : (
          <>
            <span>{item.usageType || "-"}</span>

            <span>{item.department || "-"}</span>

            {item.reference && <span>{item.reference}</span>}

            {detailed && item.notes && <span>{item.notes}</span>}
          </>
        )}

        <span>{date ? new Date(date).toLocaleDateString() : "-"}</span>
      </div>
    </div>
  );
};

export default RecentPurchaseCard;
