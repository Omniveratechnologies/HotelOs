const StockAdjustmentDifference = ({
  currentStock = 0,
  physicalStock = "",
  unit = "",
}) => {
  const current = Number(currentStock) || 0;
  const physical =
    physicalStock === "" ? null : Number(physicalStock);

  const difference =
    physical === null ? null : physical - current;

  const isIncrease = difference > 0;
  const isDecrease = difference < 0;

  const differenceColor =
    isIncrease
      ? "text-emerald-400"
      : isDecrease
        ? "text-red-400"
        : "text-gray-300";

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-300">
        Difference
      </label>

      <div
        className={`inline-flex min-h-11 items-center rounded-lg px-4 py-2.5 text-sm font-semibold ${
          difference === null
            ? "bg-gray-800 text-gray-400"
            : isIncrease
              ? "bg-emerald-500/10"
              : isDecrease
                ? "bg-red-500/10"
                : "bg-gray-800"
        } ${differenceColor}`}
      >
        {difference === null
          ? "—"
          : `${difference > 0 ? "+" : ""}${difference} ${unit}`}
      </div>
    </div>
  );
};

export default StockAdjustmentDifference;