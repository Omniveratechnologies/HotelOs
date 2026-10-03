const PurchaseOrderDetailCard = ({ purchaseOrder, tabs, table }) => {
  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const statusStyles = {
    DRAFT: "bg-gray-100 text-gray-700",
    SENT: "bg-blue-100 text-blue-700",
    CONFIRMED: "bg-indigo-100 text-indigo-700",
    PARTIALLY_RECEIVED: "bg-amber-100 text-amber-700",
    RECEIVED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  const status = purchaseOrder?.status ?? "DRAFT";

  const formattedStatus = status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <section className="bg-slate min-w-0 rounded-xl border border-gray-800/70 p-4 shadow-sm sm:p-5">
      <div className="grid grid-cols-2 gap-4 border-b border-gray-800/70 pb-5 md:grid-cols-4">
        <div>
          <p className="text-sm text-white">Supplier</p>
          <p className="mt-1 font-semibold text-gray-800">
            {purchaseOrder?.supplierName ??
              purchaseOrder?.supplier?.name ??
              "—"}
          </p>
        </div>

        <div>
          <p className="text-sm text-white">Order Date</p>
          <p className="mt-1 font-semibold text-gray-800">
            {formatDate(purchaseOrder?.orderDate)}
          </p>
        </div>

        <div>
          <p className="text-sm text-white">Expected Delivery</p>
          <p className="mt-1 font-semibold text-gray-800">
            {formatDate(purchaseOrder?.expectedDeliveryDate)}
          </p>
        </div>

        <div>
          <p className="text-sm text-white">Status</p>
          <span
            className={`mt-1 inline-flex rounded-md px-3 py-1 text-sm font-medium ${
              statusStyles[status] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {formattedStatus}
          </span>
        </div>
      </div>

      <div className="mt-4">{tabs}</div>

      <div className="mt-4">{table}</div>
    </section>
  );
};

export default PurchaseOrderDetailCard;
