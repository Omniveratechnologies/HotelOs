import { useState } from "react";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  initialsOf,
} from "../../utils/dailyreportUtils.js";

const TONES = {
  PRESENT: "border-green-500/30 bg-green-500/10 text-green-400",
  ABSENT: "border-red-500/30 bg-red-500/10 text-red-400",
  LATE: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  EARLY_LEAVE: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  ON_LEAVE: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  HOLIDAY: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
};

export const StatusPill = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${TONES[status] || "border-gray-600/40 bg-gray-700/40 text-gray-300"}`}
  >
    <span
      className="h-1.5 w-1.5 rounded-full"
      style={{ backgroundColor: STATUS_COLOR[status] || "#9ca3af" }}
    />
    {STATUS_LABEL[status] || status}
  </span>
);

export const StaffAvatar = ({ src, name, size = "h-8 w-8" }) => {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name || "Staff"}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`${size} shrink-0 rounded-full border border-gray-700 object-cover`}
      />
    );
  }
  return (
    <span
      aria-label={name || "Staff"}
      className={`${size} inline-flex shrink-0 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-[10px] font-semibold text-gray-300`}
    >
      {initialsOf(name)}
    </span>
  );
};
