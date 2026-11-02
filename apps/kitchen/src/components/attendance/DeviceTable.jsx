import { useEffect, useRef, useState } from "react";
import { FiFilter, FiMoreVertical } from "react-icons/fi";

import Table from "../ui/Table";
import Pagination from "../ui/Pagination";
import SearchBar from "../ui/SearchBar";
import EditButton from "../ui/button/EditButton";
import { DeviceStatusBadge, DeviceTypePill } from "./DeviceBadges.jsx";
import { STATUS_OPTIONS, formatLastSync } from "../../utils/deviceFormat.js";
import { formatNumber } from "../../utils/attendanceFormat.js";

const EMPTY_PAGINATION = { page: 1, limit: 10, total: 0, totalPages: 1 };

const RowMenu = ({ device, actions }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onOutside = (event) =>
      ref.current && !ref.current.contains(event.target) && setOpen(false);
    const onEscape = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const live = device.status !== "OFFLINE";

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More actions for ${device.name}`}
        className="rounded-md p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
      >
        <FiMoreVertical size={15} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-lg border border-gray-700 bg-[#151515] text-left shadow-xl"
        >
          {actions.map((action) => {
            const disabled = action.needsLive && !live;
            return (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                disabled={disabled}
                title={disabled ? "The device is offline" : undefined}
                onClick={() => {
                  setOpen(false);
                  action.onClick(device);
                }}
                className={`block w-full px-4 py-2.5 text-left text-xs transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 ${
                  action.danger
                    ? "text-red-400"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DeviceTable = ({
  devices = [],
  loading = false,
  error = "",
  onRetry,
  pagination = EMPTY_PAGINATION,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
  status = "ALL",
  onStatusChange,
  hasActiveFilters = false,
  sortBy,
  sortDirection = "asc",
  onSort,
  onView,
  onEdit,
  onCommand,
  onRegenerate,
  onRemove,
}) => {
  const { page, limit, total, totalPages } = {
    ...EMPTY_PAGINATION,
    ...pagination,
  };
  const from = total === 0 ? 0 : (page - 1) * limit + 1;

  const menu = [
    { label: "View details", onClick: onView },
    {
      label: "Test connection",
      needsLive: true,
      onClick: (device) => onCommand?.(device, "TEST_CONNECTION"),
    },
    {
      label: "Sync now",
      needsLive: true,
      onClick: (device) => onCommand?.(device, "SYNC_NOW"),
    },
    {
      label: "Restart",
      needsLive: true,
      onClick: (device) => onCommand?.(device, "RESTART"),
    },
    { label: "New device token", onClick: onRegenerate },
    { label: "Remove device", danger: true, onClick: onRemove },
  ];

  const columns = [
    { key: "serialNumber", label: "#", render: (_row, index) => from + index },
    {
      key: "name",
      label: "Device Name",
      sortable: true,
      render: (device) => (
        <button
          type="button"
          onClick={() => onView?.(device)}
          className="text-left font-medium text-gray-200 hover:text-emerald-400"
        >
          {device.name}
        </button>
      ),
    },
    {
      key: "deviceCode",
      label: "Device ID",
      sortable: true,
      render: (device) => (
        <span className="font-mono text-[11px] text-gray-400">
          {device.deviceCode}
        </span>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (device) => <DeviceTypePill type={device.type} />,
    },
    { key: "location", label: "Location", sortable: true },
    {
      key: "ipAddress",
      label: "IP Address",
      render: (device) => device.ipAddress || "-",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (device) => <DeviceStatusBadge status={device.status} />,
    },
    {
      key: "lastSyncAt",
      label: "Last Sync",
      sortable: true,
      render: (device) => (
        <span className="whitespace-nowrap">
          {formatLastSync(device.lastSyncAt)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (device) => (
        <div className="flex items-center justify-center">
          <EditButton onClick={() => onEdit?.(device)} />
          <RowMenu device={device} actions={menu} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
        <h2 className="text-sm font-semibold text-white">
          All Devices ({formatNumber(total)})
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <SearchBar
            searchTerm={search}
            setSearchTerm={onSearchChange}
            placeholder="Search devices..."
          />

          <label className="relative text-xs text-gray-400">
            <FiFilter
              size={13}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
            />
            <select
              value={status}
              onChange={(event) => onStatusChange?.(event.target.value)}
              aria-label="Filter by status"
              className="rounded-lg border border-gray-600 bg-[#0f0f0f] py-2 pr-3 pl-8 text-sm text-gray-300 outline-none focus:border-white"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

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
      </div>

      <div className="px-3">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={total}
          pageSize={limit}
          itemLabel="devices"
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
      ) : loading && devices.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-gray-400">
          Loading devices...
        </div>
      ) : (
        <div
          className={`${loading ? "opacity-60" : ""} transition-opacity [&_td]:px-2 [&_td]:py-2.5 [&_td]:text-xs [&_th]:px-2 [&_th]:py-2.5 [&_th]:text-[11px] [&_th]:font-medium`}
        >
          <Table
            columns={columns}
            data={devices}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={onSort}
            minWidthClass="min-w-[880px]"
            emptyMessage={
              hasActiveFilters
                ? "No devices match these filters."
                : "No devices yet. Use Add Device to register one."
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
          itemLabel="devices"
        />
      </div>
    </div>
  );
};

export default DeviceTable;
