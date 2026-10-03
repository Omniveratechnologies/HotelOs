const EMPTY_ARRAY = [];

const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  maxLength,
  placeholder = "",
  options = EMPTY_ARRAY,
  required = false,
  icon: Icon,
}) => {
  const commonClass =
    "w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600";

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-300">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {type === "select" && (
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
      )}

      {type === "multiselect" && (
        <select
          name={name}
          value=""
          onChange={(e) => {
            const selectedValue = e.target.value;

            if (!selectedValue) return;

            if (!value.includes(selectedValue)) {
              onChange({
                target: {
                  name,
                  value: [...value, selectedValue],
                },
              });
            }
          }}
          className={commonClass}
        >
          <option value="">Select categories</option>

          {options
            .filter((option) => !value.includes(option.value))
            .map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>
      )}

      {type === "textarea" && (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={5}
          className={`${commonClass} resize-none`}
        />
      )}

      {!["select", "multiselect", "textarea"].includes(type) && (
        <div className="relative">
          {Icon && (
            <Icon
              size={14}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
            />
          )}

          <input
            type={type}
            name={name}
            value={value}
            maxLength={maxLength}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className={`${commonClass} ${Icon ? "pl-9" : ""}`}
          />
        </div>
      )}

      {type === "multiselect" && value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((item) => (
            <span
              key={item}
              className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-400"
            >
              {item}

              <button
                type="button"
                onClick={() =>
                  onChange({
                    target: {
                      name,
                      value: value.filter((category) => category !== item),
                    },
                  })
                }
                className="text-emerald-500 hover:text-red-400"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormField;
