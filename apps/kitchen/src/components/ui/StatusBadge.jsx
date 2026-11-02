const TONES = {
  purple: { pill: "border-purple-500/30 bg-purple-500/10 text-purple-400", dot: "bg-purple-400" },
  yellow: { pill: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400", dot: "bg-yellow-400" },
  emerald: { pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", dot: "bg-emerald-400" },
  green: { pill: "border-green-500/30 bg-green-500/10 text-green-400", dot: "bg-green-400" },
  blue: { pill: "border-blue-500/30 bg-blue-500/10 text-blue-400", dot: "bg-blue-400" },
  red: { pill: "border-red-500/30 bg-red-500/10 text-red-400", dot: "bg-red-400" },
  gray: { pill: "border-gray-700 bg-gray-800 text-gray-400", dot: "bg-gray-500" },
};

const STATUS_CONFIG = {
  NEW: { label: "New", tone: "purple" },
  PREPARING: { label: "Preparing", tone: "yellow" },
  READY: { label: "Ready", tone: "emerald" },
  "OUT FOR DELIVERY": { label: "Out for Delivery", tone: "blue" },
  REJECTED: { label: "Rejected", tone: "red" },
  PARTIALLY_RECEIVED: { label: "PARTIALLY RECEIVED", tone: "yellow" },
  DRAFT: { label: "DRAFT", tone: "purple" },
  RECEIVED: { label: "RECEIVED", tone: "emerald" },
  CONFIRMED: { label: "CONFIRMED", tone: "emerald" },
  CANCELLED: { label: "CANCELLED", tone: "red" },
  "OUT OF STOCK": { label: "OUT OF STOCK", tone: "red" },
  "LOW STOCK": { label: "LOW STOCK", tone: "yellow" },
  "IN STOCK": { label: "IN STOCK", tone: "green" },

  // Staff
  ACTIVE: { label: "ACTIVE", tone: "green" },
  INACTIVE: { label: "INACTIVE", tone: "red" },
  REGISTERED: { label: "REGISTERED", tone: "green" },
  NOT_REGISTERED: { label: "NOT REGISTERED", tone: "red" },
  "NOT REGISTERED": { label: "NOT REGISTERED", tone: "red" },
  PRESENT: { label: "Present", tone: "green" },
  LATE: { label: "Late", tone: "yellow" },
  ABSENT: { label: "Absent", tone: "red" },
  ON_LEAVE: { label: "On Leave", tone: "purple" },
  HOLIDAY: { label: "Holiday", tone: "blue" },
};

const StatusBadge = ({ status }) => {
  const key = String(status ?? "").trim().toUpperCase();
  const config = STATUS_CONFIG[key];
  const tone = TONES[config?.tone] || TONES.gray;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium whitespace-nowrap ${tone.pill}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
      {config?.label || status || "Unknown"}
    </span>
  );
};

export default StatusBadge;