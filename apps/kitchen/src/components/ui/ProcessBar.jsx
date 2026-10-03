const EMPTY_ARRAY = [];

const ProcessBar = ({ items = EMPTY_ARRAY }) => {
  const totalItems = items.length;

  const receivedItems = items.filter(
    (item) => Number(item.receivedQuantity) > 0,
  ).length;

  const progress =
    totalItems > 0 ? Math.round((receivedItems / totalItems) * 100) : 0;

  return (
    <div className="bg-slate mt-5 rounded-lg border border-gray-800/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Receiving Progress</h3>

        <span className="text-xs text-gray-500">
          {receivedItems} of {totalItems} items received
        </span>
      </div>

      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-label="Receiving progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
        <span>
          {receivedItems} of {totalItems} items received
        </span>

        <span className="font-semibold">{progress}%</span>
      </div>
    </div>
  );
};

export default ProcessBar;
