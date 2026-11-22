import { useEffect, useRef, useState } from "react";
import { FiMoreVertical } from "react-icons/fi";

import Table from "../ui/Table";
import Pagination from "../ui/Pagination";
import StatusBadge from "../ui/StatusBadge";
import EditButton from "../ui/button/EditButton";
import DeleteButton from "../ui/button/DeleteButton";

const EMPTY_PAGINATION = { page: 1, limit: 10, total: 0, totalPages: 1 };

const DepartmentPill = ({ department }) => {
  if (!department) return <span className="text-gray-500">-</span>;

  const color = /^#[0-9a-f]{6}$/i.test(department.color || "")
    ? department.color
    : "#3b82f6";

  return (
    <span
      className="inline-block rounded-md px-2.5 py-1 text-[11px] font-medium"
      style={{ backgroundColor: `${color}26`, color }}
    >
      {department.name}
    </span>
  );
};

const RowMenu = ({ designation, onToggleStatus }) => {
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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More actions for ${designation.name}`}
        className="rounded-md p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
      >
        <FiMoreVertical size={15} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-lg border border-gray-700 bg-[#151515] text-left shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onToggleStatus?.(designation);
            }}
            className="block w-full px-4 py-2.5 text-left text-xs text-gray-300 transition hover:bg-gray-800 hover:text-white"
          >
            {designation.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      )}
    </div>
  );
};

const DesignationTable = ({
  designations = [],
  loading = false,
  error = "",
  onRetry,
  pagination = EMPTY_PAGINATION,
  onPageChange,
  hasActiveFilters = false,
  sortBy,
  sortDirection = "asc",
  onSort,
  editingId = "",
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const { page, limit, total, totalPages } = {
    ...EMPTY_PAGINATION,
    ...pagination,
  };
  const from = total === 0 ? 0 : (page - 1) * limit + 1;

  const columns = [
    {
      key: "serialNumber",
      label: "#",
      render: (_row, index) => from + index,
    },
    {
      key: "name",
      label: "Designation Name",
      sortable: true,
      render: (designation) => (
        <div className="text-left">
          <p
            className={`font-medium ${editingId === designation._id ? "text-emerald-400" : "text-gray-200"}`}
          >
            {designation.name}
          </p>
          {designation.code && (
            <p className="mt-0.5 text-[10px] text-gray-500">
              {designation.code}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "department",
      label: "Department",
      sortable: true,
      render: (designation) => (
        <DepartmentPill department={designation.department} />
      ),
    },
    {
      key: "staffCount",
      label: "Staff Count",
      sortable: true,
      render: (designation) => designation.staffCount ?? 0,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (designation) => <StatusBadge status={designation.status} />,
    },
    {
      key: "description",
      label: "Description",
      render: (designation) => (
        <p
          title={designation.description}
          className="mx-auto max-w-[220px] truncate text-left text-gray-400"
        >
          {designation.description || "-"}
        </p>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (designation) => (
        <div className="flex items-center justify-center gap-1">
          <EditButton onClick={() => onEdit?.(designation)} />
          <DeleteButton onClick={() => onDelete?.(designation)} />
          <RowMenu designation={designation} onToggleStatus={onToggleStatus} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="px-4 py-4">
        <h2 className="text-sm font-semibold text-white">
          Designations ({total})
        </h2>
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
      ) : loading && designations.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-gray-400">
          Loading designations...
        </div>
      ) : (
        <div
          className={
            loading ? "opacity-60 transition-opacity" : "transition-opacity"
          }
        >
          <Table
            columns={columns}
            data={designations}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={onSort}
            minWidthClass="min-w-[820px]"
            emptyMessage={
              hasActiveFilters
                ? "No designations match your search or filters."
                : "No designations yet. Add the first one."
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
          itemLabel="designations"
        />
      </div>
    </div>
  );
};

export default DesignationTable;
