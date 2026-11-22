export const ShiftDot = ({ color, className = "h-2.5 w-2.5" }) => (
  <span
    className={`inline-block shrink-0 rounded-full ${className}`}
    style={{ backgroundColor: color || "#3B82F6" }}
  />
);

export const ShiftPill = ({ shift, className = "" }) => {
  const color = shift?.color || "#3B82F6";
  return (
    <span
      className={`inline-block rounded-md border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${className}`}
      style={{
        color,
        backgroundColor: `${color}1A`,
        borderColor: `${color}4D`,
      }}
    >
      {shift?.name ?? "-"}
    </span>
  );
};

const TONES = {
  ON_DUTY: "bg-green-500/10 text-green-400 border-green-500/30",
  SCHEDULED: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  COMPLETED: "bg-gray-700/40 text-gray-300 border-gray-600/40",
  MISSED: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  ABSENT: "bg-red-500/10 text-red-400 border-red-500/30",
  ACTIVE: "bg-green-500/10 text-green-400 border-green-500/30",
  INACTIVE: "bg-gray-700/40 text-gray-400 border-gray-600/40",
};
const LABELS = {
  ON_DUTY: "On Duty",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  MISSED: "Missed",
  ABSENT: "Absent",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export const StatusPill = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${TONES[status] || TONES.INACTIVE}`}
  >
    {LABELS[status] || status}
  </span>
);
