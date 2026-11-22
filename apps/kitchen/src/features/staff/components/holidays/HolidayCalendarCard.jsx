import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import { TypeDot } from "./HolidayBadges.jsx";
import {
  WEEKDAYS,
  addDays,
  dayNumber,
  monthLabel,
  shiftMonth,
} from "../../utils/holidayUtils.js";
const HolidayCalendarCard = ({ calendar, month, onMonthChange, loading }) => {
  const cells = [];
  if (calendar) {
    for (let i = calendar.firstWeekday; i > 0; i -= 1)
      cells.push({ date: addDays(calendar.from, -i), outside: true });
    calendar.days.forEach((day) => cells.push({ date: day.date, day }));
    while (cells.length % 7 !== 0)
      cells.push({
        date: addDays(cells[cells.length - 1].date, 1),
        outside: true,
      });
  }

  return (
    <section
      aria-label="Holiday calendar"
      aria-busy={loading}
      className="rounded-lg border border-gray-800 p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">Holiday Calendar</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
            aria-label="Previous month"
            className="rounded-md p-1.5 text-gray-400 transition hover:bg-[#1a1a1a] hover:text-white"
          >
            <FiChevronLeft size={14} />
          </button>
          <span className="min-w-[104px] text-center text-xs font-medium text-gray-200">
            {monthLabel(month)}
          </span>
          <button
            type="button"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
            aria-label="Next month"
            className="rounded-md p-1.5 text-gray-400 transition hover:bg-[#1a1a1a] hover:text-white"
          >
            <FiChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-[10px] font-medium text-gray-500">
        {WEEKDAYS.map((name) => (
          <span key={name} className="py-1">
            {name}
          </span>
        ))}
      </div>

      <div
        className={`grid grid-cols-7 gap-y-1 transition-opacity ${loading ? "opacity-60" : ""}`}
      >
        {cells.map(({ date, day, outside }) => {
          if (outside)
            return (
              <span
                key={date}
                className="flex h-10 justify-center pt-1 text-[11px] text-gray-700"
              >
                {dayNumber(date)}
              </span>
            );
          const holidays = day.holidays;
          const national = holidays.some((h) => h.type === "NATIONAL");
          const custom = holidays.some((h) => h.type === "CUSTOM");
          return (
            <span
              key={date}
              data-date={date}
              title={holidays.map((h) => h.name).join(", ") || undefined}
              aria-label={`${date}${day.isToday ? " (today)" : ""}${holidays.length ? `: ${holidays.map((h) => h.name).join(", ")}` : ""}`}
              className="flex h-10 flex-col items-center justify-start pt-1"
            >
              <span
                className={`flex h-5 w-5 items-center justify-center text-[11px] font-medium ${
                  day.isToday
                    ? "rounded-full bg-emerald-600 text-white"
                    : holidays.length
                      ? "text-white"
                      : "text-gray-300"
                }`}
              >
                {dayNumber(date)}
              </span>
              <span
                className="mt-0.5 flex h-1.5 items-center gap-0.5"
                aria-hidden="true"
              >
                {national && <TypeDot type="NATIONAL" />}
                {custom && <TypeDot type="CUSTOM" />}
              </span>
            </span>
          );
        })}
        {!calendar && (
          <p className="col-span-7 py-10 text-center text-xs text-gray-500">
            {loading ? "Loading calendar..." : "Calendar unavailable."}
          </p>
        )}
      </div>

      <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-gray-400">
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Today
        </li>
        <li className="flex items-center gap-1.5">
          <TypeDot type="NATIONAL" className="h-2 w-2" />
          National Holiday
        </li>
        <li className="flex items-center gap-1.5">
          <TypeDot type="CUSTOM" className="h-2 w-2" />
          Custom Holiday
        </li>
      </ul>
    </section>
  );
};

export default HolidayCalendarCard;
