import { FiRotateCcw, FiSearch } from "react-icons/fi";

import ActionButton from "../ui/button/ActionButton.jsx";
import { fieldCls, inputCls } from "../../utils/holidayUtils.js";

const HolidayFilters = ({
  filters,
  searchInput,
  onSearchChange,
  years,
  onFilterChange,
  onReset,
}) => (
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
        placeholder="Search holiday name or description..."
        aria-label="Search holidays"
        className={`${inputCls} h-10 pl-9`}
      />
    </div>

    <select
      value={filters.type}
      onChange={(e) => onFilterChange("type", e.target.value)}
      aria-label="Type"
      className={`${fieldCls} h-10 w-auto shrink-0 pr-8`}
    >
      <option value="">All Types</option>
      <option value="NATIONAL">National</option>
      <option value="CUSTOM">Custom</option>
    </select>

    <select
      value={filters.status}
      onChange={(e) => onFilterChange("status", e.target.value)}
      aria-label="Status"
      className={`${fieldCls} h-10 w-auto shrink-0 pr-8`}
    >
      <option value="">All Status</option>
      <option value="UPCOMING">Upcoming</option>
      <option value="COMPLETED">Completed</option>
    </select>

    <select
      value={filters.year}
      onChange={(e) => onFilterChange("year", e.target.value)}
      aria-label="Year"
      className={`${fieldCls} h-10 w-auto shrink-0 pr-8`}
    >
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>

    <ActionButton
      variant="outline"
      icon={<FiRotateCcw size={13} />}
      onClick={onReset}
      className="h-10 shrink-0"
    >
      Reset
    </ActionButton>
  </div>
);

export default HolidayFilters;
