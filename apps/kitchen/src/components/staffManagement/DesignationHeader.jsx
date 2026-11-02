import { useMemo } from "react";
import { FiRefreshCw, FiSearch } from "react-icons/fi";

import Filters from "../ui/Filters";

const DesignationHeader = ({
  searchTerm = "",
  onSearchChange,
  departments = [],
  departmentId = "",
  onDepartmentChange,
  status = "",
  onStatusChange,
  onReset,
}) => {
  const filterOptions = useMemo(
    () => [
      {
        name: "department",
        options: [
          { label: "All Departments", value: "ALL" },
          ...departments.map((item) => ({ label: item.name, value: item._id })),
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
    ],
    [departments],
  );

  const handleChange = (name, value) => {
    const next = value === "ALL" ? "" : value;
    if (name === "department") onDepartmentChange?.(next);
    else onStatusChange?.(next);
  };

  return (
    <div className="flex flex-col gap-3 border-b border-gray-800 p-4 xl:flex-row xl:items-center">
      <div className="relative min-w-0 flex-1">
        <FiSearch
          size={15}
          className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
        />

        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Search designation by name or department..."
          aria-label="Search designations"
          className="w-full rounded-lg border border-gray-700 bg-[#0f0f0f] py-2.5 pr-3 pl-9 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-emerald-600"
        />
      </div>

      <Filters
        filters={filterOptions}
        values={{ department: departmentId || "ALL", status: status || "ALL" }}
        onChange={handleChange}
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
  );
};

export default DesignationHeader;
