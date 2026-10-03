const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);

const PurchaseOrderSummaryCard = ({
  po,
  onSend,
  onConfirm,
  onCancel,
  onReceiveStock,
  onMarkAsReceived,
}) => {
  const items = po?.items ?? [];

  const subtotal = Number(po?.subtotal ?? 0);
  const taxPercentage = Number(po?.taxPercentage ?? 0);
  const taxAmount = Number(po?.taxAmount ?? 0);
  const totalAmount = Number(po?.totalAmount ?? 0);

  const amountReceived = items.reduce((sum, item) => {
    const received = Number(item.receivedQuantity ?? 0);
    const unitCost = Number(item.unitCost ?? 0);
    return sum + received * unitCost;
  }, 0);

  const pendingAmount = Math.max(totalAmount - amountReceived, 0);

  const allowed = po?.allowedActions ?? [];

  return (
    <aside className="bg-slate h-fit w-full rounded-xl border border-gray-800/70 p-5 shadow-sm">
      <h2 className="text-base font-semibold text-white">Order Summary</h2>

      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium text-gray-200">
            {formatCurrency(subtotal)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Tax ({taxPercentage}%)</span>
          <span className="font-medium text-gray-200">
            {formatCurrency(taxAmount)}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-gray-800/70 pb-4 text-sm">
          <span className="text-gray-400">Total Amount</span>
          <span className="font-semibold text-emerald-500">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Amount Received</span>
          <span className="font-medium text-gray-200">
            {formatCurrency(amountReceived)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Pending Amount</span>
          <span className="font-semibold text-red-500">
            {formatCurrency(pendingAmount)}
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-800/70 pt-5">
        <h3 className="text-sm font-semibold text-gray-200">Quick Actions</h3>

        <div className="mt-4 space-y-3">
          {allowed.includes("send") && (
            <button
              type="button"
              onClick={onSend}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Send to Supplier
            </button>
          )}

          {allowed.includes("confirm") && (
            <button
              type="button"
              onClick={onConfirm}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Mark as Confirmed
            </button>
          )}

          {allowed.includes("receive") && (
            <button
              type="button"
              onClick={onReceiveStock}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-white-700"
            >
              Receive Stock
            </button>
          )}

          {allowed.includes("receiveAll") && (
            <button
              type="button"
              onClick={onMarkAsReceived}
              className="bg-slate w-full rounded-lg border border-gray-700 px-4 py-3 text-sm font-medium text-gray-200 transition hover:bg-gray-800"
            >
              Mark as Received
            </button>
          )}

          {allowed.includes("cancel") && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-lg border border-red-800 px-4 py-3 text-sm font-medium text-red-500 transition hover:bg-red-950/40"
            >
              Cancel PO
            </button>
          )}

          {allowed.length === 0 && (
            <p className="text-center text-xs text-gray-500">
              No actions available — this order is {po?.status?.toLowerCase()}.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};

export default PurchaseOrderSummaryCard;
