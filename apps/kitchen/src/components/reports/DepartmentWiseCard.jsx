import { STATUS_COLOR } from "../../utils/dailyreportUtils.js";

const PARTS = [
  ["present", "Present", STATUS_COLOR.PRESENT],
  ["late", "Late", STATUS_COLOR.LATE],
  ["earlyLeave", "Early Leave", STATUS_COLOR.EARLY_LEAVE],
  ["absent", "Absent", STATUS_COLOR.ABSENT],
];

const DepartmentWiseCard = ({ departments }) => {
  const max = Math.max(1, ...(departments || []).map((d) => d.total));

  return (
    <section
      aria-label="Department wise attendance"
      className="rounded-lg border border-gray-800 p-4"
    >
      <h2 className="mb-3 text-sm font-semibold text-white">
        Department Wise Attendance
      </h2>

      <ul className="space-y-2">
        {(departments || []).map((dept) => (
          <li
            key={dept._id || dept.name}
            className="flex items-center gap-2 text-[11px] text-gray-300"
          >
            <span className="w-24 shrink-0 truncate" title={dept.name}>
              {dept.name}
            </span>
            <span className="w-5 shrink-0 text-right text-gray-400">
              {dept.total}
            </span>
            <div
              className="flex h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#1f1f1f]"
              title={PARTS.map(([key, label]) => `${label}: ${dept[key]}`).join(
                " · ",
              )}
            >
              <div
                className="flex h-full"
                style={{ width: `${(dept.total / max) * 100}%` }}
              >
                {PARTS.map(([key, , color]) =>
                  dept[key] ? (
                    <span
                      key={key}
                      style={{
                        width: `${(dept[key] / dept.total) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  ) : null,
                )}
              </div>
            </div>
          </li>
        ))}
        {departments && !departments.length && (
          <li className="py-3 text-center text-xs text-gray-500">
            No attendance for this date.
          </li>
        )}
        {!departments && (
          <li className="py-3 text-center text-xs text-gray-500">Loading...</li>
        )}
      </ul>

      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-gray-500">
        {PARTS.map(([key, label, color]) => (
          <span key={key} className="inline-flex items-center gap-1">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
};

export default DepartmentWiseCard;
