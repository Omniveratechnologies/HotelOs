import { FiRotateCcw, FiSearch } from "react-icons/fi";

import ActionButton from "../ui/button/ActionButton.jsx";
import { fieldCls, inputCls } from "../../utils/faceUtils.js";

const FaceStaffFilters = ({
  filters,
  searchInput,
  departments,
  onSearchChange,
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
        placeholder="Search by name, ID, department..."
        aria-label="Search staff"
        className={`${inputCls} h-10 pl-9`}
      />
    </div>

    <select
      value={filters.department}
      onChange={(e) => onFilterChange("department", e.target.value)}
      aria-label="Department"
      className={`${fieldCls} h-10 w-auto shrink-0 pr-8`}
    >
      <option value="">All Departments</option>
      {departments.map((d) => (
        <option key={d._id} value={d._id}>
          {d.name}
        </option>
      ))}
    </select>

    <select
      value={filters.faceStatus}
      onChange={(e) => onFilterChange("faceStatus", e.target.value)}
      aria-label="Face status"
      className={`${fieldCls} h-10 w-auto shrink-0 pr-8`}
    >
      <option value="">Face Status</option>
      <option value="REGISTERED">Registered</option>
      <option value="NOT_REGISTERED">Not Registered</option>
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

export default FaceStaffFilters;
