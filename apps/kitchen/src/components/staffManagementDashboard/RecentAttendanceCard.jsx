import { useMemo } from "react";
import { FiMoreVertical } from "react-icons/fi";

import Table from "../ui/Table.jsx";
import { StaffAvatar } from "../reports/ReportBadges.jsx";
import {
  STATUS_LOOK,
  displayStatus,
  formatClockTime,
} from "../../utils/dashboardUtils.js";

export const DashboardStatusPill = ({ status }) => {
  const look = STATUS_LOOK[status] || {
    label: status,
    tone: "border-gray-600/40 bg-gray-700/40 text-gray-300",
    dot: "#9ca3af",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${look.tone}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: look.dot }}
      />
      {look.label}
    </span>
  );
};

const dash = (value) => (value && value !== "-" ? value : "—");
const RecentAttendanceCard = ({ rows, loading, onViewAll, onOpen }) => {
  const columns = useMemo(
    () => [
      { key: "no", label: "#", render: (_row, index) => index + 1 },
      {
        key: "staff",
        label: "Staff",
        render: (row) => (
          <span className="mx-auto flex w-40 items-center gap-2 text-left">
            <StaffAvatar
              src={row.staff.photoUrl}
              name={row.staff.name}
              size="h-9 w-9"
            />
            <span className="min-w-0">
              <span className="block truncate font-medium text-white">
                {row.staff.name}
              </span>
              <span className="block text-[10px] text-gray-500">
                {row.staff.staffCode}
              </span>
            </span>
          </span>
        ),
      },
      {
        key: "department",
        label: "Department",
        render: (row) => row.department?.name || "—",
      },
      {
        key: "checkIn",
        label: "Check-in",
        render: (row) => (row.checkInAt ? formatClockTime(row.checkInAt) : "—"),
      },
      {
        key: "checkOut",
        label: "Check-out",
        render: (row) =>
          row.checkOutAt ? formatClockTime(row.checkOutAt) : "—",
      },
      {
        key: "status",
        label: "Status",
        render: (row) => <DashboardStatusPill status={displayStatus(row)} />,
      },
      { key: "hours", label: "Hours", render: (row) => dash(row.workingHours) },
      {
        key: "device",
        label: "Device",
        render: (row) => row.device?.name || "—",
      },
      {
        key: "actions",
        label: "",
        render: (row) => (
          <button
            type="button"
            onClick={() => onOpen(row)}
            aria-label={`Details of ${row.staff.name}`}
            className="rounded-md p-1.5 text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
          >
            <FiMoreVertical size={15} />
          </button>
        ),
      },
    ],
    [onOpen],
  );

  return (
    <section
      aria-label="Recent attendance"
      className="rounded-lg border border-gray-800"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold text-white">Recent Attendance</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
        >
          View All →
        </button>
      </div>
      <Table
        columns={columns}
        data={rows || []}
        minWidthClass="min-w-[760px]"
        emptyMessage={
          loading
            ? "Loading attendance..."
            : "No attendance recorded for this day yet."
        }
      />
    </section>
  );
};

export default RecentAttendanceCard;
