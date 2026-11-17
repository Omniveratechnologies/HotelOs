import { TYPE_COLORS } from "../../utils/holidayUtils.js";

const TYPE_TONES = {
  NATIONAL: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  CUSTOM: "border-purple-500/30 bg-purple-500/10 text-purple-400",
};
const STATUS_TONES = {
  COMPLETED: "border-gray-600/40 bg-gray-700/40 text-gray-300",
  UPCOMING: "border-green-500/30 bg-green-500/10 text-green-400",
};

const pill =
  "inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap";

export const TypePill = ({ type }) => (
  <span className={`${pill} ${TYPE_TONES[type] || TYPE_TONES.CUSTOM}`}>
    {type === "NATIONAL" ? "National" : "Custom"}
  </span>
);

export const StatusPill = ({ status }) => (
  <span className={`${pill} ${STATUS_TONES[status] || STATUS_TONES.COMPLETED}`}>
    {status === "UPCOMING" ? "Upcoming" : "Completed"}
  </span>
);

export const TypeDot = ({ type, className = "h-1.5 w-1.5" }) => (
  <span
    className={`inline-block shrink-0 rounded-full ${className}`}
    style={{ backgroundColor: TYPE_COLORS[type] || TYPE_COLORS.CUSTOM }}
  />
);
