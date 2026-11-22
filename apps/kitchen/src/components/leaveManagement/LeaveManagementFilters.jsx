import { FiCalendar, FiRotateCcw, FiSearch } from "react-icons/fi";

import { buttonGhost, inputCls } from "../../utils/leaveManagementUtils.js";

const field = inputCls.replace("w-full", "").trim();

const LeaveManagementFilters = ({
  filters = {},
  searchInput,
  onSearchChange,
  departments = [],
  leaveTypes = [],
  onFilterChange,
  onReset,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
      <div className="relative min-w-[200px] flex-1 lg:min-w-0">
        <FiSearch
          size={14}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, leave type or department..."
          className={`${inputCls} h-10 pl-9`}
        />
      </div>

      <select
        value={filters.department}
        onChange={(e) => onFilterChange("department", e.target.value)}
        className={`${field} h-10 w-auto shrink-0 pr-8`}
        aria-label="Department"
      >
        <option value="">All Departments</option>
        {departments.map((d) => (
          <option key={d._id} value={d._id}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        value={filters.leaveType}
        onChange={(e) => onFilterChange("leaveType", e.target.value)}
        className={`${field} h-10 w-auto shrink-0 pr-8`}
        aria-label="Leave type"
      >
        <option value="">All Leave Types</option>
        {leaveTypes.map((t) => (
          <option key={t._id} value={t._id}>
            {t.name}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => onFilterChange("status", e.target.value)}
        className={`${field} h-10 w-auto shrink-0 pr-8`}
        aria-label="Status"
      >
        <option value="">All Status</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
        <option value="CANCELLED">Cancelled</option>
      </select>

      <div className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-gray-700 bg-[#151515] px-3 focus-within:border-emerald-400">
        <FiCalendar size={14} className="shrink-0 text-gray-500" />
        <input
          type="date"
          value={filters.from}
          onChange={(e) => onFilterChange("from", e.target.value)}
          className="w-[108px] bg-transparent text-xs text-gray-200 [color-scheme:dark] outline-none"
          aria-label="Leave from"
        />
        <span className="text-xs text-gray-500">–</span>
        <input
          type="date"
          value={filters.to}
          min={filters.from || undefined}
          onChange={(e) => onFilterChange("to", e.target.value)}
          className="w-[108px] bg-transparent text-xs text-gray-200 [color-scheme:dark] outline-none"
          aria-label="Leave until"
        />
      </div>

      <button
        type="button"
        onClick={onReset}
        className={`${buttonGhost} h-10 shrink-0`}
      >
        <FiRotateCcw size={13} />
        Reset
      </button>
    </div>
  );
};

export default LeaveManagementFilters;
