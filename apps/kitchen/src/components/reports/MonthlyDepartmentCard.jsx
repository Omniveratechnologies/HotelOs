import { useState } from "react";

import {
  MONTHLY_COLOR,
  formatCount,
  percentText,
} from "../../utils/monthlyReportUtils.js";

const PARTS = [
  ["present", "Present", MONTHLY_COLOR.PRESENT],
  ["late", "Late", MONTHLY_COLOR.LATE],
  ["halfDay", "Half Day", MONTHLY_COLOR.HALF_DAY],
  ["onLeave", "On Leave", MONTHLY_COLOR.ON_LEAVE],
  ["holiday", "Holiday", MONTHLY_COLOR.HOLIDAY],
  ["absent", "Absent", MONTHLY_COLOR.ABSENT],
];

const MonthlyDepartmentCard = ({ departments }) => {
  const [all, setAll] = useState(false);
  const list = departments || [];
  const shown = all ? list : list.slice(0, 8);

  return (
    <section
      aria-label="Department wise attendance"
      className="rounded-lg border border-gray-800 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">
          Department Wise Attendance
        </h2>
        {list.length > 8 && (
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
        {shown.map((dept) => (
          <li
            key={dept._id || dept.name}
            className="flex items-center gap-2 text-[11px] text-gray-300"
          >
            <span className="w-24 shrink-0 truncate" title={dept.name}>
              {dept.name}
            </span>
            <div
              className="flex h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#1f1f1f]"
              title={PARTS.map(
                ([key, label]) => `${label}: ${formatCount(dept[key])}`,
              ).join(" · ")}
            >
              {PARTS.map(([key, , color]) =>
                dept[key] ? (
                  <span
                    key={key}
                    style={{
                      width: `${(dept[key] / dept.records) * 100}%`,
                      backgroundColor: color,
                    }}
                  />
                ) : null,
              )}
            </div>
            <span className="w-11 shrink-0 text-right font-medium text-gray-200">
              {percentText(dept.attendancePercent)}
            </span>
          </li>
        ))}
        {departments && !departments.length && (
          <li className="py-3 text-center text-xs text-gray-500">
            No attendance for this month.
          </li>
        )}
        {!departments && (
          <li className="py-3 text-center text-xs text-gray-500">Loading...</li>
        )}
      </ul>

      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-gray-500">
        {PARTS.filter(([key]) => key !== "holiday").map(
          ([key, label, color]) => (
            <span key={key} className="inline-flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              {label}
            </span>
          ),
        )}
      </div>
    </section>
  );
};

export default MonthlyDepartmentCard;
