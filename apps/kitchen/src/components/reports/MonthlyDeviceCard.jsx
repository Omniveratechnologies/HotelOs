import { useState } from "react";
import { FiMonitor } from "react-icons/fi";

import { formatCount, percentText } from "../../utils/monthlyReportUtils.js";

const tone = (percent) =>
  percent === null || percent === undefined
    ? "#4b5563"
    : percent >= 95
      ? "#22c55e"
      : percent >= 85
        ? "#f59e0b"
        : "#ef4444";
const MonthlyDeviceCard = ({ devices }) => {
  const [all, setAll] = useState(false);
  const list = devices || [];
  const shown = all ? list : list.slice(0, 5);

  return (
    <section
      aria-label="Device wise attendance"
      className="rounded-lg border border-gray-800 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">
          Device Wise Attendance
        </h2>
        {list.length > 5 && (
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
            className="flex items-center gap-2 text-[11px] text-gray-300"
            title={`${formatCount(device.checkIns)} check-ins`}
          >
            <FiMonitor size={13} className="shrink-0 text-gray-500" />
            <span className="w-28 shrink-0 truncate" title={device.name}>
              {device.name}
            </span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#1f1f1f]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${device.onTimePercent ?? 0}%`,
                  backgroundColor: tone(device.onTimePercent),
                }}
              />
            </div>
            <span className="w-11 shrink-0 text-right font-medium text-gray-200">
              {percentText(device.onTimePercent)}
            </span>
          </li>
        ))}
        {devices && !devices.length && (
          <li className="py-3 text-center text-xs text-gray-500">
            No device check-ins this month.
          </li>
        )}
        {!devices && (
          <li className="py-3 text-center text-xs text-gray-500">Loading...</li>
        )}
      </ul>
    </section>
  );
};

export default MonthlyDeviceCard;
