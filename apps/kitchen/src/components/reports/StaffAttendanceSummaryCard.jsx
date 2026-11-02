import { useMemo } from "react";
import { FiChevronDown, FiChevronUp, FiEye, FiSearch } from "react-icons/fi";

import Table from "../ui/Table.jsx";
import Pagination from "../ui/Pagination.jsx";
import { StaffAvatar } from "../reports/ReportBadges.jsx";
import {
  bandColor,
  fieldCls,
  inputCls,
  percentText,
} from "../../utils/monthlyReportUtils.js";

const SortHead = ({ label, field, sort, direction, onSort }) => (
  <button
    type="button"
    onClick={() => onSort(field)}
    aria-label={`Sort by ${label}`}
    className="inline-flex items-center gap-1 hover:text-white"
  >
    {label}
    {sort === field &&
      (direction === "desc" ? (
        <FiChevronDown size={11} />
      ) : (
        <FiChevronUp size={11} />
      ))}
  </button>
);

const num = (value, color) => (
  <span className={value > 0 ? color : "text-gray-500"}>{value}</span>
);

const StaffAttendanceSummaryCard = ({
  rows,
  pagination,
  loading,
  limit,
  sort,
  direction,
  search,
  onSearch,
  onSort,
  onPageChange,
  onLimitChange,
  onOpen,
}) => {
  const head = (label, field) => (
    <SortHead
      label={label}
      field={field}
      sort={sort}
      direction={direction}
      onSort={onSort}
    />
  );

  const columns = useMemo(
    () => [
      {
        key: "no",
        label: "#",
        render: (_row, index) =>
          (pagination.page - 1) * pagination.limit + index + 1,
      },
      {
        key: "staff",
        label: head("Staff", "name"),
        render: (row) => (
          <span className="mx-auto flex w-40 items-center gap-2 text-left font-medium text-white">
            <StaffAvatar src={row.staff.photoUrl} name={row.staff.name} />
            {row.staff.name}
          </span>
        ),
      },
      {
        key: "staffCode",
        label: head("Staff ID", "staffCode"),
        render: (row) => row.staff.staffCode,
      },
      {
        key: "department",
        label: "Department",
        render: (row) => row.department?.name || "-",
      },
      {
        key: "present",
        label: head("Present", "present"),
        render: (row) => num(row.present, "text-emerald-400"),
      },
      {
        key: "absent",
        label: head("Absent", "absent"),
        render: (row) => num(row.absent, "text-red-400"),
      },
      {
        key: "late",
        label: head("Late", "late"),
        render: (row) => num(row.late, "text-yellow-400"),
      },
      {
        key: "leave",
        label: head("Leave", "leave"),
        render: (row) => num(row.leave, "text-blue-400"),
      },
      {
        key: "halfDay",
        label: head("Half Day", "halfDay"),
        render: (row) => num(row.halfDay, "text-orange-400"),
      },
      { key: "totalDays", label: "Total Days", render: (row) => row.totalDays },
      {
        key: "attendance",
        label: head("Attendance %", "attendancePercent"),
        render: (row) =>
          row.attendancePercent === null ? (
            <span className="text-gray-500">-</span>
          ) : (
            <span className="mx-auto flex w-32 items-center gap-2">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1f1f1f]">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.min(row.attendancePercent, 100)}%`,
                    backgroundColor: bandColor(row.band),
                  }}
                />
              </span>
              <span
                className="w-11 text-right font-medium"
                style={{ color: bandColor(row.band) }}
              >
                {percentText(row.attendancePercent)}
              </span>
            </span>
          ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => (
          <button
            type="button"
            onClick={() => onOpen(row)}
            aria-label={`Details of ${row.staff.name}`}
            className="rounded-md p-1.5 text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
          >
            <FiEye size={15} />
          </button>
        ),
      },
    ],
    [rows, sort, direction, pagination.page, pagination.limit],
  );

  return (
    <section
      aria-label="Staff attendance summary"
      className="rounded-lg border border-gray-800"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">
          Staff Attendance Summary ({pagination.total})
        </h2>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <div className="relative">
            <FiSearch
              size={13}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search staff by name or ID..."
              aria-label="Search staff"
              className={`${inputCls} w-56 py-1.5 pl-8`}
            />
          </div>
          <label className="flex items-center gap-2">
            Show
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              aria-label="Rows per page"
              className={`${fieldCls} w-auto py-1.5`}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div
        className={
          loading ? "opacity-60 transition-opacity" : "transition-opacity"
        }
      >
        <Table
          columns={columns}
          data={rows}
          minWidthClass="min-w-[900px]"
          emptyMessage={
            loading
              ? "Loading staff..."
              : "No staff match these filters for this month."
          }
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-800 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="px-2 text-xs text-gray-500">
          {pagination.from}–{pagination.to} of {pagination.total}
        </p>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </section>
  );
};

export default StaffAttendanceSummaryCard;
