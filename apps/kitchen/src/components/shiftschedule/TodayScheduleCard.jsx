import { useMemo } from "react";
import { FiEye } from "react-icons/fi";

import Avatar from "../ui/Avatar.jsx";
import Table from "../ui/Table.jsx";
import { ShiftPill, StatusPill } from "./ShiftBadges.jsx";
import { formatLong } from "../../utils/shiftScheduleUtils.js";

export const scheduleColumns = ({ onView, offset = 0 } = {}) => [
  { key: "serial", label: "#", render: (_row, index) => offset + index + 1 },
  {
    key: "staff",
    label: "Staff",
    render: (row) => (
      <div className="flex items-center justify-center gap-2.5">
        <Avatar src={row.staff.photoUrl} name={row.staff.name} size={32} />
        <div className="text-left leading-tight">
          <p className="text-[13px] font-semibold text-white">
            {row.staff.name}
          </p>
          <p className="text-[10px] text-gray-500">{row.staff.staffCode}</p>
        </div>
      </div>
    ),
  },
  {
    key: "department",
    label: "Department",
    render: (row) => row.department?.name ?? "-",
  },
  {
    key: "shift",
    label: "Shift",
    render: (row) => <ShiftPill shift={row.shift} />,
  },
  { key: "checkIn", label: "Check In", render: (row) => row.checkIn || "-" },
  { key: "checkOut", label: "Check Out", render: (row) => row.checkOut || "-" },
  {
    key: "status",
    label: "Status",
    render: (row) => <StatusPill status={row.status} />,
  },
  ...(onView
    ? [
        {
          key: "actions",
          label: "Actions",
          render: (row) => (
            <button
              type="button"
              onClick={() => onView(row)}
              aria-label={`View ${row.staff.name}'s schedule`}
              className="rounded-md p-2 text-gray-400 transition hover:bg-[#1a1a1a] hover:text-white"
            >
              <FiEye size={15} />
            </button>
          ),
        },
      ]
    : []),
];

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
