const FilterByDate = ({ value, onChange, label = "Filter by date" }) => {
  return (
    <div className="relative w-40">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-700 bg-[#0f0f0f] py-2 pr-3 pl-9 text-xs text-gray-300 outline-none focus:border-white"
        aria-label={label}
      />
    </div>
  );
};

export default FilterByDate;
