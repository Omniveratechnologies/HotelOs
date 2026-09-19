const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  options = [],
  required = false,
}) => {
  const commonClass =
    "w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-emerald-500";

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-300">
        {label}
      </label>

      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={commonClass}
        >
          <option value="">Select {label}</option>

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={commonClass}
        />
      )}
    </div>
  );
};

export default FormField;
