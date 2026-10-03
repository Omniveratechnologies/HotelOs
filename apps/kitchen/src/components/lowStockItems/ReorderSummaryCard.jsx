const ReorderSummaryCard = ({ items = [] }) => {
  const totalItems = items.length;

  const totalRecommendedQty = items.reduce(
    (total, item) => total + Number(item.reorderQuantity || 0),
    0,
  );

  const estimatedPurchaseValue = items.reduce(
    (total, item) => total + Number(item.estimatedPurchaseValue || 0),
    0,
  );

  return (
    <div className="bg-slate rounded-lg border border-gray-800 p-3">
      <h3 className="text-white-800 mb-3 text-xs font-semibold">
        Reorder Summary
      </h3>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-white-500 text-[10px]">Total Items</span>

          <span className="text-white-800 text-[10px] font-semibold">
            {totalItems}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white-500 text-[10px]">
            Total Recommended Qty
          </span>

          <span className="text-white-800 text-[10px] font-semibold">
            {totalRecommendedQty}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white-500 text-[10px]">
            Estimated Purchase Value
          </span>

          <span className="text-white-800 text-[10px] font-semibold">
            ₹{estimatedPurchaseValue.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReorderSummaryCard;
