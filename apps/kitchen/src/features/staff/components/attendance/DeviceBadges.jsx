import {
  STATUS_COLORS,
  TYPE_OPTIONS,
  typeLabel,
} from "../../utils/deviceFormat.js";

const LABELS = { ONLINE: "Online", OFFLINE: "Offline", WARNING: "Warning" };

export const DeviceStatusBadge = ({ status }) => {
  const color = STATUS_COLORS[status] || "#6b7280";

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium whitespace-nowrap"
      style={{
        borderColor: `${color}4d`,
        backgroundColor: `${color}1a`,
        color,
      }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {LABELS[status] || status || "Unknown"}
    </span>
  );
};

export const DeviceTypePill = ({ type }) => {
  const color =
    TYPE_OPTIONS.find((item) => item.value === type)?.color || "#6b7280";

  return (
    <span
      className="inline-block rounded-md px-2.5 py-1 text-[11px] font-medium whitespace-nowrap"
      style={{ backgroundColor: `${color}26`, color }}
    >
      {typeLabel(type)}
    </span>
  );
};
