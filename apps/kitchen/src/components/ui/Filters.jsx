import { FiFilter } from "react-icons/fi";

const Filters = ({ filters, values, onChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-3 border-gray-800">
      {filters.map((filter) => (
        <div key={filter.name} className="relative">
          <FiFilter
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
          />

          <select
            value={values[filter.name]}
            onChange={(e) => onChange(filter.name, e.target.value)}
            className="w-40 appearance-none rounded-lg border border-gray-700 bg-[#0f0f0f] py-2 pr-8 pl-9 text-xs text-gray-300 outline-none"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};

export default Filters;
