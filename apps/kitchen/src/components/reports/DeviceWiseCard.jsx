import { useState } from "react";
import { FiMonitor } from "react-icons/fi";

const DeviceWiseCard = ({ devices }) => {
  const [all, setAll] = useState(false);
  const shown = (devices || []).slice(0, all ? 10 : 5);

  return (
    <section
      aria-label="Device wise records"
      className="rounded-lg border border-gray-800 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">
          Device Wise Records
        </h2>
        {(devices || []).length > 5 && (
          <button
            type="button"
            onClick={() => setAll((v) => !v)}
            className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
          >
            {all ? "Show less" : "View All →"}
          </button>
        )}
      </div>

      <ul className="space-y-2.5">
        {shown.map((device) => (
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
            <span className="shrink-0 text-gray-400">
              {device.records} records
            </span>
            <span
              className={`w-16 shrink-0 text-right font-medium ${device.onlinePercent === null ? "text-gray-600" : device.onlinePercent >= 95 ? "text-emerald-400" : "text-yellow-400"}`}
            >
              {device.onlinePercent === null ||
              device.onlinePercent === undefined
                ? "-"
                : `${Math.round(device.onlinePercent)}% online`}
            </span>
          </li>
        ))}
        {devices && !devices.length && (
          <li className="py-3 text-center text-xs text-gray-500">
            No device records for this date.
          </li>
        )}
        {!devices && (
          <li className="py-3 text-center text-xs text-gray-500">Loading...</li>
        )}
      </ul>
    </section>
  );
};

export default DeviceWiseCard;
