import { useMemo } from "react";

import Table from "@/components/ui/Table.jsx";
import { formatLong, scheduleColumns } from "../../utils/shiftscheduleUtils.jsx";

const TodayScheduleCard = ({
  date,
  isToday = true,
  rows,
  total,
  loading,
  onViewAll,
  onView,
}) => {
  const columns = useMemo(() => scheduleColumns({ onView }), [onView]);

  return (
    <section
      aria-label="Today's schedule"
      className="rounded-lg border border-gray-800"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">
          {isToday ? "Today's Schedule" : "Schedule"}
          {date ? ` (${formatLong(date)})` : ""}
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
        >
          View All →
        </button>
      </div>
      <div
        className={
          loading ? "opacity-60 transition-opacity" : "transition-opacity"
        }
      >
        <Table
          columns={columns}
          data={rows}
          minWidthClass="min-w-[760px]"
          emptyMessage={
            loading
              ? "Loading schedule..."
              : "Nobody is scheduled for this day."
          }
        />
      </div>
      {total > rows.length && (
        <p className="px-4 pb-3 text-[11px] text-gray-500">
          Showing {rows.length} of {total}
        </p>
      )}
    </section>
  );
};

export default TodayScheduleCard;
