export const EmployeeCell = ({ staff }) => {
  const initials = (staff?.name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center justify-center gap-2.5">
      {staff?.photoUrl ? (
        <img
          src={staff.photoUrl}
          alt=""
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-800 text-[10px] font-semibold text-gray-300">
          {initials}
        </span>
      )}
      <div className="text-left leading-tight">
        <p className="text-[13px] font-semibold text-white">
          {staff?.name ?? "-"}
        </p>
        <p className="text-[10px] text-gray-500">{staff?.staffCode}</p>
      </div>
    </div>
  );
};

export const LeaveTypeBadge = ({ type }) => {
  const color = type?.color || "#3B82F6";
  return (
    <span
      className="inline-block rounded-md border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap"
      style={{
        color,
        backgroundColor: `${color}1A`,
        borderColor: `${color}4D`,
      }}
    >
      {type?.name ?? "-"}
    </span>
  );
};

const STATUS_TONE = {
  APPROVED: {
    label: "Approved",
    pill: "bg-green-500/10 text-green-400",
    dot: "bg-green-400",
  },
  PENDING: {
    label: "Pending",
    pill: "bg-yellow-500/10 text-yellow-400",
    dot: "bg-yellow-400",
  },
  REJECTED: {
    label: "Rejected",
    pill: "bg-red-500/10 text-red-400",
    dot: "bg-red-400",
  },
  CANCELLED: {
    label: "Cancelled",
    pill: "bg-gray-700/40 text-gray-400",
    dot: "bg-gray-500",
  },
};

export const LeaveStatusBadge = ({ status }) => {
  const tone =
    STATUS_TONE[String(status ?? "").toUpperCase()] || STATUS_TONE.CANCELLED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${tone.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {tone.label}
    </span>
  );
};
