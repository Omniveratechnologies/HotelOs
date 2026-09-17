const StatusBadge = ({ status }) => {
  const statusStyles = {
    NEW: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    PREPARING: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    READY: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    "OUT FOR DELIVERY": "border-blue-500/30 bg-blue-500/10 text-blue-400",
    REJECTED: "border-red-500/30 bg-red-500/10 text-red-400",
  };

  const statusLabels = {
    NEW: "New",
    PREPARING: "Preparing",
    READY: "Ready",
    "OUT FOR DELIVERY": "Out for Delivery",
    REJECTED: "Rejected",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${
        statusStyles[status] || "border-gray-700 bg-gray-800 text-gray-400"
      }`}
    >
      {statusLabels[status] || status || "Unknown"}
    </span>
  );
};

export default StatusBadge;
