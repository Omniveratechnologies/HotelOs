import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import { ShiftDot } from "./ShiftBadges.jsx";
import {
  WEEKDAYS,
  addDays,
  dayNumber,
  monthLabel,
  shiftMonth,
} from "../../utils/shiftScheduleUtils.js";

const MonthCalendar = ({
  calendar,
  month,
  onMonthChange,
  onSelectDate,
  selectedDate,
  loading,
  large = false,
}) => {
  const byDate = new Map((calendar?.days || []).map((day) => [day.date, day]));

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
    <div aria-label="Month calendar" aria-busy={loading}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
            aria-label="Previous month"
            className="rounded-md border border-gray-700 p-1.5 text-gray-400 transition hover:bg-[#1a1a1a] hover:text-white"
          >
            <FiChevronLeft size={14} />
          </button>
          <span className="min-w-[110px] text-center text-xs font-medium text-gray-200">
            {monthLabel(month)}
          </span>
          <button
            type="button"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
            aria-label="Next month"
            className="rounded-md border border-gray-700 p-1.5 text-gray-400 transition hover:bg-[#1a1a1a] hover:text-white"
          >
            <FiChevronRight size={14} />
          </button>
        </div>
      </div>

      <div
        className={`grid grid-cols-7 text-center text-[10px] font-medium text-gray-500 ${large ? "gap-1.5" : ""}`}
      >
        {WEEKDAYS.map((name) => (
          <span key={name} className="py-1">
            {name}
          </span>
        ))}
      </div>

      <div
        className={`grid grid-cols-7 ${large ? "gap-1.5" : "gap-y-1"} ${loading ? "opacity-60" : ""} transition-opacity`}
      >
        {cells.map(({ date, day, outside }) => {
          const isToday = date === calendar.today;
          const isSelected = date === selectedDate;
          if (outside) {
            return (
              <span
                key={date}
                className={`flex flex-col items-center justify-start text-gray-700 ${large ? "min-h-[76px] p-2 text-xs" : "h-10 pt-1 text-[11px]"}`}
              >
                {dayNumber(date)}
              </span>
            );
          }
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate?.(date)}
              aria-label={`${date}${isToday ? " (today)" : ""}`}
              aria-pressed={isSelected}
              data-date={date}
              className={`flex flex-col items-center rounded-lg transition ${large ? "min-h-[76px] items-stretch border p-2 text-left" : "h-10 justify-start pt-1"} ${
                large
                  ? `${isSelected ? "border-emerald-400 bg-emerald-950/30" : "border-gray-800 hover:border-gray-600 hover:bg-[#151515]"} ${isToday ? "ring-1 ring-emerald-500/60" : ""}`
                  : "hover:bg-[#1a1a1a]"
              }`}
            >
              <span
                className={`flex items-center justify-center text-[11px] font-medium ${
                  isToday
                    ? "h-5 w-5 rounded-md bg-emerald-600 text-white"
                    : day.isHoliday
                      ? "text-blue-300"
                      : "text-gray-300"
                } ${large ? "self-start" : ""}`}
              >
                {dayNumber(date)}
              </span>

              {large ? (
                <div className="mt-1.5 space-y-0.5">
                  {day.isHoliday && (
                    <p className="text-[10px] text-blue-300">Holiday</p>
                  )}
                  {day.shifts.map((shift) => (
                    <p
                      key={shift.shiftId}
                      className="flex items-center justify-between gap-1 text-[10px] text-gray-400"
                    >
                      <span className="flex min-w-0 items-center gap-1">
                        <ShiftDot color={shift.color} className="h-1.5 w-1.5" />
                        <span className="truncate">{shift.name}</span>
                      </span>
                      <span className="text-gray-300">{shift.count}</span>
                    </p>
                  ))}
                </div>
              ) : (
                <span
                  className="mt-0.5 flex h-1.5 items-center gap-0.5"
                  aria-hidden="true"
                >
                  {day.shifts.map((shift) => (
                    <ShiftDot
                      key={shift.shiftId}
                      color={shift.color}
                      className="h-1 w-1"
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
        {!calendar && (
          <p className="col-span-7 py-10 text-center text-xs text-gray-500">
            {loading ? "Loading calendar..." : "Calendar unavailable."}
          </p>
        )}
      </div>

      {calendar && (
        <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-gray-400">
          {calendar.legend.map((shift) => (
            <li key={shift.shiftId} className="flex items-center gap-1.5">
              <ShiftDot color={shift.color} className="h-2 w-2" />
              {shift.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MonthCalendar;
