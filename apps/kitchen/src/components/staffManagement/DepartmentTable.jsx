import { useEffect, useRef, useState } from "react";
import { FiMoreVertical } from "react-icons/fi";

import Table from "../ui/Table";
import Pagination from "../ui/Pagination";
import StatusBadge from "../ui/StatusBadge";
import ViewButton from "../ui/button/ViewButton";
import EditButton from "../ui/button/EditButton";
import DepartmentIcon from "./DepartmentIcon.jsx";
import { departmentKey } from "../../utils/departmentOptions.js";

const EMPTY_PAGINATION = { page: 1, limit: 10, total: 0, totalPages: 1 };
const RowMenu = ({ department, onToggleStatus, onDelete }) => {
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

  const item =
    "block w-full px-4 py-2.5 text-left text-xs transition hover:bg-gray-800";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More actions for ${department.name}`}
        className="rounded-md p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
      >
        <FiMoreVertical size={15} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-lg border border-gray-700 bg-[#151515] text-left shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onToggleStatus?.(department);
            }}
            className={`${item} text-gray-300 hover:text-white`}
          >
            {department.isActive ? "Deactivate" : "Activate"}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete?.(department);
            }}
            className={`${item} text-red-400 hover:text-red-300`}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

const DepartmentTable = ({
  departments = [],
  loading = false,
  error = "",
  onRetry,
  pagination = EMPTY_PAGINATION,
  onPageChange,
  hasActiveFilters = false,
  selectedKey = "",
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
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
      label: "Department Name",
      render: (department) => {
        const selected =
          selectedKey && selectedKey === departmentKey(department);

        return (
          <button
            type="button"
            onClick={() => onView?.(department)}
            aria-current={selected ? "true" : undefined}
            className="flex items-center gap-3 text-left"
          >
            <DepartmentIcon icon={department.icon} color={department.color} />
            <span
              className={`font-medium ${selected ? "text-emerald-400" : "text-gray-200"}`}
            >
              {department.name}
            </span>
          </button>
        );
      },
    },
    {
      key: "code",
      label: "Department Code",
      render: (department) => department.code || "-",
    },
    {
      key: "staffCount",
      label: "Staff Count",
      render: (department) => department.staffCount ?? 0,
    },
    {
      key: "status",
      label: "Status",
      render: (department) => <StatusBadge status={department.status} />,
    },
    {
      key: "description",
      label: "Description",
      render: (department) => (
        <p
          title={department.description}
          className="mx-auto max-w-[220px] truncate text-left text-gray-400"
        >
          {department.description || "-"}
        </p>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (department) => (
        <div className="flex items-center justify-center gap-1">
          <ViewButton onClick={() => onView?.(department)} />
          <EditButton onClick={() => onEdit?.(department)} />
          <RowMenu
            department={department}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="px-4 py-4">
        <h2 className="text-sm font-semibold text-white">
          Departments ({total})
        </h2>
        <p className="mt-1 text-[11px] text-gray-500">
          Click a department to see its details
        </p>
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
      ) : loading && departments.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-gray-400">
          Loading departments...
        </div>
      ) : (
        <div
          className={
            loading ? "opacity-60 transition-opacity" : "transition-opacity"
          }
        >
          <Table
            columns={columns}
            data={departments}
            minWidthClass="min-w-[760px]"
            emptyMessage={
              hasActiveFilters
                ? "No departments match your search or filter."
                : "No departments yet. Add the first one."
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
          itemLabel="departments"
        />
      </div>
    </div>
  );
};

export default DepartmentTable;
