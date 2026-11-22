import { useId } from "react";

const EMPTY_ARRAY = [];

const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  onValueChange,
  maxLength,
  placeholder = "",
  options = EMPTY_ARRAY,
  required = false,
  icon: Icon,
  register,
  error,
  disabled = false,
  min,
  max,
  autoComplete,
}) => {
  const generatedId = useId();
  const id = `${name}-${generatedId}`;
  const errorId = `${id}-error`;

  const commonClass =
    "w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50";

  const registration = register ? register(name) : {};

  const registeredProps = register
    ? {
        ...registration,
        onChange: (event) => {
          registration.onChange(event);
          onValueChange?.(event.target.value);
        },
      }
    : {};

  const controlledProps =
    value !== undefined
      ? {
          value,
          onChange: (event) => {
            onChange?.(event);
            onValueChange?.(event.target.value);
          },
        }
      : {};

  const sharedProps = {
    id,
    name,
    required,
    disabled,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? errorId : undefined,
    ...(register ? registeredProps : {}),
    ...controlledProps,
  };

  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium text-gray-300"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {type === "select" ? (
        <select {...sharedProps} className={commonClass}>
          <option value="">Select {label}</option>

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          {...sharedProps}
          placeholder={placeholder}
          rows={3}
          maxLength={maxLength}
          className={`${commonClass} resize-y`}
        />
      ) : (
        <div className="relative">
          {Icon && (
            <Icon
              size={15}
              aria-hidden="true"
              className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
            />
          )}

          <input
            {...sharedProps}
            type={type}
            placeholder={placeholder}
            maxLength={maxLength}
            min={min}
            max={max}
            autoComplete={autoComplete}
            className={`${commonClass} ${Icon ? "pl-9" : ""}`}
          />
        </div>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-400">
          {error.message}
        </p>
      )}
    </div>
  );
};

export default FormField;
