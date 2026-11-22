import { FiMonitor } from "react-icons/fi";

import { timeAgo } from "../../utils/dashboardUtils.js";
const DeviceStatusCard = ({ devices, now, onViewAll }) => (
  <section
    aria-label="Device status"
    className="rounded-lg border border-gray-800 p-4"
  >
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-white">Device Status</h2>
      <button
        type="button"
        onClick={onViewAll}
        className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
      >
        View All →
      </button>
    </div>

    <ul className="space-y-2.5">
      {(devices || []).map((device) => (
        <li
          key={device._id || device.name}
          className="flex items-center gap-2 text-[11px]"
        >
          <FiMonitor size={13} className="shrink-0 text-gray-500" />
          <span
            className="min-w-0 flex-1 truncate text-gray-200"
            title={device.name}
          >
            {device.name}
          </span>
          <span
            className={`inline-flex shrink-0 items-center gap-1 ${device.online ? "text-emerald-400" : "text-red-400"}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${device.online ? "bg-emerald-400" : "bg-red-400"}`}
            />
            {device.online ? "Online" : "Offline"}
          </span>
          <span className="shrink-0 text-right text-[10px] whitespace-nowrap text-gray-500">
            Last seen: {timeAgo(device.lastSeenAt, now)}
          </span>
        </li>
      ))}
      {devices && !devices.length && (
        <li className="py-3 text-center text-xs text-gray-500">
          No devices yet.
        </li>
      )}
      {!devices && (
        <li className="py-3 text-center text-xs text-gray-500">Loading...</li>
      )}
    </ul>
  </section>
);

export default DeviceStatusCard;
