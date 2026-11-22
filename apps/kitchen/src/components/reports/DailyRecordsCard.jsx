import { useMemo } from "react";
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiMoreVertical,
} from "react-icons/fi";

import Table from "../ui/Table.jsx";
import { StaffAvatar, StatusPill } from "./ReportBadges.jsx";
import { fieldCls, formatClockTime } from "../../utils/dailyreportUtils.js";

const arrow =
  "rounded-md border border-gray-700 p-1.5 text-gray-400 transition hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-40";
const box = "h-3.5 w-3.5 cursor-pointer accent-emerald-500";

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

const DailyRecordsCard = ({
  rows,
  pagination,
  loading,
  limit,
  sort,
  direction,
  selected,
  onToggle,
  onToggleAll,
  onSort,
  onPageChange,
  onLimitChange,
  onOpen,
}) => {
  const allSelected =
    rows.length > 0 && rows.every((row) => selected.has(row._id));
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
        key: "select",
        label: (
          <input
            type="checkbox"
            className={box}
            checked={allSelected}
            onChange={onToggleAll}
            aria-label="Select all rows on this page"
          />
        ),
        render: (row) => (
          <input
            type="checkbox"
            className={box}
            checked={selected.has(row._id)}
            onChange={() => onToggle(row._id)}
            aria-label={`Select ${row.staff.name}`}
          />
        ),
      },
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
        label: "Staff ID",
        render: (row) => row.staff.staffCode,
      },
      {
        key: "department",
        label: "Department",
        render: (row) => row.department?.name || "-",
      },
      {
        key: "checkIn",
        label: head("Check In", "checkInAt"),
        render: (row) => formatClockTime(row.checkInAt),
      },
      {
        key: "checkOut",
        label: head("Check Out", "checkOutAt"),
        render: (row) => formatClockTime(row.checkOutAt),
      },
      {
        key: "work",
        label: head("Work Hours", "workMinutes"),
        render: (row) => row.workingHours,
      },
      {
        key: "status",
        label: head("Status", "status"),
        render: (row) => <StatusPill status={row.status} />,
      },
      {
        key: "device",
        label: "Device",
        render: (row) => row.device?.name || "-",
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
            <FiMoreVertical size={15} />
          </button>
        ),
      },
    ],
    [
      rows,
      selected,
      allSelected,
      sort,
      direction,
      pagination.page,
      pagination.limit,
    ],
  );

  return (
    <section
      aria-label="Attendance records"
      className="rounded-lg border border-gray-800"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">
          Attendance Records ({pagination.total})
        </h2>

        <div className="flex items-center gap-3 text-xs text-gray-400">
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
          <span>
            {pagination.from}–{pagination.to} of {pagination.total}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            aria-label="Previous page"
            className={arrow}
          >
            <FiChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
            aria-label="Next page"
            className={arrow}
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
          data={rows}
          minWidthClass="min-w-[860px]"
          emptyMessage={
            loading
              ? "Loading records..."
              : "No attendance records for these filters."
          }
        />
      </div>
    </section>
  );
};

export default DailyRecordsCard;
