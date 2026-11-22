import { useMemo } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiMoreVertical,
} from "react-icons/fi";

import Table from "../ui/Table.jsx";
import {
  EmployeeCell,
  LeaveStatusBadge,
  LeaveTypeBadge,
} from "./LeaveBadges.jsx";
import {
  formatAppliedDate,
  formatLeaveDate,
  inputCls,
} from "../../utils/leaveManagementUtils.js";

const selectCls = inputCls.replace("w-full", "").trim();

const LeaveManagementTable = ({
  leaves,
  loading,
  pagination,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onView,
  onOpenMenu,
}) => {
  const columns = useMemo(
    () => [
      {
        key: "serial",
        label: "#",
        render: (_row, index) => (page - 1) * limit + index + 1,
      },
      {
        key: "employee",
        label: "Employee",
        render: (row) => <EmployeeCell staff={row.staff} />,
      },
      {
        key: "department",
        label: "Department",
        render: (row) => row.department?.name ?? "-",
      },
      {
        key: "leaveType",
        label: "Leave Type",
        render: (row) => <LeaveTypeBadge type={row.leaveType} />,
      },
      {
        key: "fromDate",
        label: "From Date",
        render: (row) => formatLeaveDate(row.fromDate),
      },
      {
        key: "toDate",
        label: "To Date",
        render: (row) => formatLeaveDate(row.toDate),
      },
      {
        key: "days",
        label: "Total Days",
        render: (row) => row.days,
      },
      {
        key: "status",
        label: "Status",
        render: (row) => <LeaveStatusBadge status={row.status} />,
      },
      {
        key: "appliedAt",
        label: "Applied On",
        render: (row) => formatAppliedDate(row.appliedAt),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => (
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => onView(row._id)}
              aria-label="View leave request"
              className="rounded-md p-2 text-gray-400 transition hover:bg-[#1a1a1a] hover:text-white"
            >
              <FiEye size={15} />
            </button>
            <button
              type="button"
              onClick={(e) => onOpenMenu(e, row)}
              aria-label="More actions"
              className="rounded-md p-2 text-gray-400 transition hover:bg-[#1a1a1a] hover:text-white"
            >
              <FiMoreVertical size={15} />
            </button>
          </div>
        ),
      },
    ],
    [page, limit, onView, onOpenMenu],
  );

  return (
    <section className="rounded-lg border border-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">
          Leave Requests ({pagination.total})
        </h2>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <label className="flex items-center gap-2">
            Show
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className={`${selectCls} w-auto py-1.5`}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <span>
            {pagination.from}–{pagination.to} of {pagination.total}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            disabled={page <= 1}
            aria-label="Previous page"
            className="rounded-md border border-gray-700 p-1.5 transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() =>
              onPageChange(Math.min(page + 1, pagination.totalPages))
            }
            disabled={page >= pagination.totalPages}
            aria-label="Next page"
            className="rounded-md border border-gray-700 p-1.5 transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiChevronRight size={14} />
          </button>
        </div>
      </div>

      <div
        className={
          loading ? "opacity-60 transition-opacity" : "transition-opacity"
        }
      >
        <Table
          columns={columns}
          data={leaves}
          emptyMessage={
            loading
              ? "Loading leave requests..."
              : "No leave requests match these filters. Try a wider date range."
          }
        />
      </div>
    </section>
  );
};

export default LeaveManagementTable;
