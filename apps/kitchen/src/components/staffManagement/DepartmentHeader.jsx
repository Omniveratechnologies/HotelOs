import { FiRefreshCw, FiSearch } from "react-icons/fi";

import Filters from "../ui/Filters";

const STATUS_FILTER = [
  {
    name: "status",
    options: [
      { label: "All Status", value: "ALL" },
      { label: "Active", value: "ACTIVE" },
      { label: "Inactive", value: "INACTIVE" },
    ],
  },
];

const DepartmentHeader = ({
  searchTerm = "",
  onSearchChange,
  status = "",
  onStatusChange,
  onReset,
}) => (
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
        placeholder="Search department by name or description..."
        aria-label="Search departments"
        className="w-full rounded-lg border border-gray-700 bg-[#0f0f0f] py-2.5 pr-3 pl-9 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-emerald-600"
      />
    </div>

    <Filters
      filters={STATUS_FILTER}
      values={{ status: status || "ALL" }}
      onChange={(_name, value) =>
        onStatusChange?.(value === "ALL" ? "" : value)
      }
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

export default DepartmentHeader;
