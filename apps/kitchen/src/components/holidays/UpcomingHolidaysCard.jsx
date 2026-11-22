import { FiArrowRight } from "react-icons/fi";

import { TypePill } from "./HolidayBadges.jsx";
import { formatDate } from "../../utils/holidayUtils.js";

const UpcomingHolidaysCard = ({ rows, loading, onViewAll }) => (
  <section
    aria-label="Upcoming holidays"
    className="rounded-lg border border-gray-800 p-4"
  >
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-white">
        Upcoming Holidays ({rows.length})
      </h2>
      <button
        type="button"
        onClick={onViewAll}
        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
      >
        View All <FiArrowRight size={12} />
      </button>
    </div>

    {rows.length === 0 ? (
      <p className="py-4 text-center text-xs text-gray-500">
        {loading ? "Loading..." : "No upcoming holidays."}
      </p>
    ) : (
      <ul className="divide-y divide-gray-800">
        {rows.map((row) => (
          <li
            key={row._id}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-[84px] shrink-0 text-[11px] leading-tight text-gray-400">
                <p>{formatDate(row.date)}</p>
                <p className="text-gray-500">
                  {row.isToday ? "Today" : row.day}
                </p>
              </div>
              <p className="truncate text-xs font-semibold text-white">
                {row.name}
              </p>
            </div>
            <TypePill type={row.type} />
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default UpcomingHolidaysCard;
