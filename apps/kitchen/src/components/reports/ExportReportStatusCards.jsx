import { FiCheck } from "react-icons/fi";
import { REPORT_TYPES } from "../../utils/exportReport.constants.js";

const ExportReportStatusCards = ({
  selected,
  onSelect,
  reports = REPORT_TYPES,
}) => {
  return (
    <div
      role="radiogroup"
      aria-label="Report type"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
    >
      {reports.map(
        ({ value, label, description, icon: Icon, iconBg, iconColor }) => {
          const active = selected === value;

          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(value)}
              className={`relative flex min-w-0 items-center gap-3 rounded-lg border px-4 py-3 text-left transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                active
                  ? "border-emerald-500 bg-emerald-950/30"
                  : "border-gray-800 hover:border-gray-600 hover:bg-gray-900/40"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
              >
                <Icon size={18} />
              </span>

              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">
                  {label}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[11px] text-gray-500">
                  {description}
                </span>
              </span>

              {active && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-black">
                  <FiCheck size={10} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        },
      )}
    </div>
  );
};

export default ExportReportStatusCards;
