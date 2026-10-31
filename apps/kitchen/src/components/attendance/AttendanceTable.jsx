import { useEffect, useRef, useState } from "react";
import { FiMoreVertical } from "react-icons/fi";

import Table from "../ui/Table";
import Pagination from "../ui/Pagination";
import StatusBadge from "../ui/StatusBadge";
import Avatar from "../ui/Avatar";
import {
  formatDate,
  formatNumber,
  formatTime,
} from "../../utils/attendanceFormat.js";

const EMPTY_PAGINATION = { page: 1, limit: 10, total: 0, totalPages: 1 };

const DepartmentPill = ({ department }) => {
  if (!department) return <span className="text-gray-500">-</span>;

  const color = /^#[0-9a-f]{6}$/i.test(department.color || "")
    ? department.color
    : "#3b82f6";

  return (
    <span
      className="inline-block rounded-md px-2.5 py-1 text-[11px] font-medium whitespace-nowrap"
      style={{ backgroundColor: `${color}26`, color }}
    >
      {department.name}
    </span>
  );
};

const RowMenu = ({ record, onView, onCorrect }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target))
        setOpen(false);
    };
    const onEscape = (event) => event.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const item = (label, handler) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        setOpen(false);
        handler?.(record);
      }}
      className="block w-full px-4 py-2.5 text-left text-xs text-gray-300 transition hover:bg-gray-800 hover:text-white"
    >
      {label}
    </button>
  );

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More actions for ${record.staff.name} on ${record.date}`}
        className="rounded-md p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
      >
        <FiMoreVertical size={15} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-lg border border-gray-700 bg-[#151515] text-left shadow-xl"
        >
          {item("View details", onView)}
          {item("Correct attendance", onCorrect)}
        </div>
      )}
    </div>
  );
};

const AttendanceTable = ({
  records = [],
  loading = false,
  error = "",
  onRetry,
  pagination = EMPTY_PAGINATION,
  onPageChange,
  onLimitChange,
  hasActiveFilters = false,
  sortBy,
  sortDirection = "desc",
  onSort,
  selectedIds,
  onSelectionChange,
  onView,
  onCorrect,
}) => {
  const { page, limit, total, totalPages } = {
    ...EMPTY_PAGINATION,
    ...pagination,
  };
  const from = total === 0 ? 0 : (page - 1) * limit + 1;

  const columns = [
    { key: "serialNumber", label: "#", render: (_row, index) => from + index },
    {
      key: "staff",
      label: "Staff",
      render: (record) => (
        <div className="flex items-center gap-3 text-left">
          <Avatar
            src={record.staff.photoUrl}
            name={record.staff.name}
            size={28}
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-200">
              {record.staff.name}
            </p>
            <p className="text-[10px] text-gray-500">
              {record.staff.staffCode}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (record) => <DepartmentPill department={record.department} />,
    },
    {
      key: "designation",
      label: "Designation",
      render: (record) => record.designation?.name || "-",
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (record) => (
        <span className="whitespace-nowrap">{formatDate(record.date)}</span>
      ),
    },
    {
      key: "checkInAt",
      label: "Check In",
      sortable: true,
      render: (record) => formatTime(record.checkInAt),
    },
    {
      key: "checkOutAt",
      label: "Check Out",
      sortable: true,
      render: (record) => formatTime(record.checkOutAt),
    },
    {
      key: "workMinutes",
      label: "Working Hours",
      sortable: true,
      render: (record) => record.workingHours,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (record) => <StatusBadge status={record.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (record) => (
        <RowMenu record={record} onView={onView} onCorrect={onCorrect} />
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
        <h2 className="text-sm font-semibold text-white">
          Attendance Records ({formatNumber(total)})
        </h2>

        <label className="flex items-center gap-2 text-xs text-gray-400">
          Show
          <select
            value={limit}
            onChange={(event) => onLimitChange?.(Number(event.target.value))}
            aria-label="Rows per page"
            className="rounded-md border border-gray-700 bg-[#0f0f0f] px-2 py-1.5 text-xs text-gray-300 outline-none"
          >
            {[10, 25, 50].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="px-3">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={total}
          pageSize={limit}
          itemLabel="records"
        />
      </div>

      {error ? (
        <div className="px-4 py-12 text-center">
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
            >
              Retry
            </button>
          )}
        </div>
      ) : loading && records.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-gray-400">
          Loading attendance records...
        </div>
      ) : (
        <div
          className={`${
            loading ? "opacity-60 transition-opacity" : "transition-opacity"
          } [&_td]:px-2 [&_td]:py-2.5 [&_td]:text-xs [&_th]:px-2 [&_th]:py-2.5 [&_th]:text-[11px] [&_th]:font-medium`}
        >
          <Table
            columns={columns}
            data={records}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={onSort}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={onSelectionChange}
            minWidthClass="min-w-[880px]"
            emptyMessage={
              hasActiveFilters
                ? "No attendance records match these filters."
                : "No attendance records yet."
            }
          />
        </div>
      )}

      <div className="border-t border-gray-800 px-3 py-1">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={total}
          pageSize={limit}
          itemLabel="records"
        />
      </div>
    </div>
  );
};

export default AttendanceTable;
