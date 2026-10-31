import { useMemo, useState } from "react";
import { FiSearch, FiRefreshCw } from "react-icons/fi";

import Table from "../ui/Table";
import Pagination from "../ui/Pagination";
import Filters from "../ui/Filters";
import FilterByDate from "../ui/FilterByDate";
import StatusBadge from "../ui/StatusBadge";
import ViewButton from "../ui/button/ViewButton";
import DeleteButton from "../ui/button/DeleteButton";
import EditButton from "../ui/button/EditButton";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const EMPTY_PAGINATION = { page: 1, limit: 10, total: 0, totalPages: 1 };

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "NA";

const StaffPhoto = ({ src, name }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-400">
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="mx-auto h-9 w-9 rounded-full object-cover"
    />
  );
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const AllStaffTable = ({
  staff = [],
  loading = false,
  error = "",
  onRetry,

  pagination = EMPTY_PAGINATION,
  onPageChange,
  onPageSizeChange,

  searchTerm = "",
  onSearchChange,
  filters = {},
  departments = [],
  designations = [],
  onFilterChange,
  onReset,

  sortBy,
  sortDirection = "asc",
  onSort,

  onView,
  onEdit,
  onDelete,
}) => {
  const { page, limit, total, totalPages } = {
    ...EMPTY_PAGINATION,
    ...pagination,
  };

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const filterOptions = useMemo(() => {
    const visibleDesignations = filters.department_id
      ? designations.filter(
          (item) => String(item.departmentId) === String(filters.department_id),
        )
      : designations;

    return [
      {
        name: "department",
        options: [
          { label: "All Departments", value: "ALL" },
          ...departments.map((item) => ({ label: item.name, value: item._id })),
        ],
      },
      {
        name: "designation",
        options: [
          { label: "All Designations", value: "ALL" },
          ...visibleDesignations.map((item) => ({
            label: item.name,
            value: item._id,
          })),
        ],
      },
      {
        name: "status",
        options: [
          { label: "All Status", value: "ALL" },
          { label: "Active", value: "ACTIVE" },
          { label: "Inactive", value: "INACTIVE" },
        ],
      },
    ];
  }, [departments, designations, filters.department_id]);

  const filterValues = {
    department: filters.department_id || "ALL",
    designation: filters.designation_id || "ALL",
    status: filters.status || "ALL",
  };

  const handleFilterChange = (name, value) => {
    const key = {
      department: "department_id",
      designation: "designation_id",
      status: "status",
    }[name];
    onFilterChange?.(key, value === "ALL" ? "" : value);
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    filters.department_id ||
    filters.designation_id ||
    filters.status ||
    filters.joinDate,
  );

  const columns = [
    {
      key: "serialNumber",
      label: "#",
      render: (_row, index) => from + index,
    },
    {
      key: "photo",
      label: "Photo",
      render: (member) => (
        <StaffPhoto src={member.photoUrl} name={member.name} />
      ),
    },
    {
      key: "name",
      label: "Staff Name",
      sortable: true,
      render: (member) => (
        <div className="text-left">
          <p className="font-medium text-gray-200">{member.name || "-"}</p>
          <p className="mt-1 text-[10px] text-gray-500">
            {member.email || "-"}
          </p>
        </div>
      ),
    },
    {
      key: "staffCode",
      label: "Staff ID",
      sortable: true,
      render: (member) => member.staffCode || "-",
    },
    {
      key: "department",
      label: "Department",
      render: (member) => member.department || "-",
    },
    {
      key: "designation",
      label: "Designation",
      render: (member) => member.designation || "-",
    },
    {
      key: "phone",
      label: "Phone",
      render: (member) => member.phone || "-",
    },
    {
      key: "joinedOn",
      label: "Join Date",
      sortable: true,
      render: (member) => formatDate(member.joinedOn),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (member) => <StatusBadge status={member.status} />,
    },
    {
      key: "face",
      label: "Face",
      render: (member) => (
        <StatusBadge status={member.faceStatus || "NOT_REGISTERED"} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (member) => (
        <div className="flex items-center justify-center gap-1">
          <ViewButton onClick={() => onView?.(member)} />
          <EditButton onClick={() => onEdit?.(member)} />
          <DeleteButton onClick={() => onDelete?.(member)} />
        </div>
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#111111]">
      <div className="flex flex-col gap-3 border-b border-gray-800 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <FiSearch
              size={15}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Search by name, staff ID, phone, email..."
              className="w-full rounded-lg border border-gray-700 bg-[#0f0f0f] py-2.5 pr-3 pl-9 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-emerald-600"
            />
          </div>

          <Filters
            filters={filterOptions}
            values={filterValues}
            onChange={handleFilterChange}
          />

          <FilterByDate
            value={filters.joinDate || ""}
            onChange={(value) => onFilterChange?.("joinDate", value)}
            label="Filter staff by join date"
          />

          <button
            type="button"
            onClick={onReset}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 transition hover:bg-gray-800"
          >
            <FiRefreshCw size={13} />
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <h2 className="text-sm font-semibold text-white">
            All Staff ({total})
          </h2>
          <p className="mt-1 text-[11px] text-gray-500">
            Staff directory and employment details
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-400">
            Show
            <select
              value={limit}
              onChange={(event) =>
                onPageSizeChange?.(Number(event.target.value))
              }
              className="rounded-md border border-gray-700 bg-[#0f0f0f] px-2 py-1.5 text-gray-200 outline-none focus:border-emerald-600"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <span className="text-xs text-gray-500">
            {total === 0 ? "0 of 0" : `${from}–${to} of ${total}`}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange?.(page - 1)}
              className="rounded-md border border-gray-700 px-2.5 py-1.5 text-xs text-gray-300 hover:bg-gray-800 disabled:opacity-40"
              aria-label="Previous page"
            >
              ‹
            </button>

            <span className="min-w-14 text-center text-xs text-gray-400">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange?.(page + 1)}
              className="rounded-md border border-gray-700 px-2.5 py-1.5 text-xs text-gray-300 hover:bg-gray-800 disabled:opacity-40"
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-red-400">{error}</p>
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
      ) : loading && staff.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-gray-400">
          Loading staff...
        </div>
      ) : (
        <div
          className={
            loading ? "opacity-60 transition-opacity" : "transition-opacity"
          }
        >
          <Table
            columns={columns}
            data={staff}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={onSort}
            minWidthClass="min-w-[1100px]"
            emptyMessage={
              hasActiveFilters
                ? "No staff members match your search or filters."
                : "No staff members yet."
            }
          />
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-gray-800 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="px-2 text-xs text-gray-500">
          {total === 0
            ? "Showing 0 staff"
            : `Showing ${from} to ${to} of ${total} staff`}
        </p>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};

export default AllStaffTable;
