import { useEffect, useState } from "react";

import Avatar from "../ui/Avatar.jsx";
import MonthCalendar from "./MonthCalendar.jsx";
import { ShiftPill, StatusPill } from "./ShiftBadges.jsx";
import { api, formatLong, query } from "../../utils/shiftScheduleUtils.js";

const ShiftCalendarTab = ({
  calendar,
  month,
  onMonthChange,
  loading,
  selectedDate,
  onSelectDate,
  refreshKey,
  onViewAll,
  onView,
}) => {
  const [day, setDay] = useState({ rows: [], total: 0 });
  const [dayLoading, setDayLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setDayLoading(true);
    api(`/schedule?${query({ date: selectedDate, limit: 8 })}`, {
      signal: controller.signal,
    })
      .then((res) => setDay({ rows: res.data, total: res.pagination.total }))
      .catch(() => setDay({ rows: [], total: 0 }))
      .finally(() => {
        if (!controller.signal.aborted) setDayLoading(false);
      });
    return () => controller.abort();
  }, [selectedDate, refreshKey]);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section
        aria-label="Shift calendar"
        className="rounded-lg border border-gray-800 p-4"
      >
        <MonthCalendar
          large
          calendar={calendar}
          month={month}
          onMonthChange={onMonthChange}
          onSelectDate={onSelectDate}
          selectedDate={selectedDate}
          loading={loading}
        />
      </section>

      <section
        aria-label="Selected day"
        className="rounded-lg border border-gray-800 p-4"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">
            {formatLong(selectedDate)}
          </h2>
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
          >
            View All →
          </button>
        </div>
        <p className="mb-3 text-[11px] text-gray-500">{day.total} scheduled</p>
        <ul className={`space-y-2 ${dayLoading ? "opacity-60" : ""}`}>
          {day.rows.map((row) => (
            <li key={row.staff._id}>
              <button
                type="button"
                onClick={() => onView(row)}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-800 px-3 py-2 text-left transition hover:bg-[#151515]"
              >
                <Avatar
                  src={row.staff.photoUrl}
                  name={row.staff.name}
                  size={30}
                />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-xs font-semibold text-white">
                    {row.staff.name}
                  </span>
                  <span className="block truncate text-[10px] text-gray-500">
                    {row.department?.name ?? "-"}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <ShiftPill shift={row.shift} />
                  <StatusPill status={row.status} />
                </span>
              </button>
            </li>
          ))}
          {day.rows.length === 0 && (
            <li className="py-6 text-center text-xs text-gray-500">
              {dayLoading ? "Loading..." : "Nobody is scheduled for this day."}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
};

export default ShiftCalendarTab;
