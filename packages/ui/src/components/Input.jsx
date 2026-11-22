import { cn } from "@hotelos/utils";

/**
 * @typedef {React.InputHTMLAttributes<HTMLInputElement> & {
 *   label?: string,
 *   error?: string,
 *   hint?: string,
 *   containerClassName?: string
 * }} InputProps
 *
 * Self-closing form input component with optional label, hint, and validation error messages.
 *
 * @param {InputProps} props
 * @returns {React.ReactElement} The rendered input component.
 */
export function Input({
  label,
  error,
  hint,
  id,
  name,
  className = "",
  containerClassName = "",
  required = false,
  ...props
}) {
  const inputId = id || name;

  return (
    <div className={cn("block", containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-brand-900 mb-1.5 block text-sm font-semibold"
        >
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        required={required}
        className={cn(
          "text-brand-900 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm transition outline-none placeholder:text-gray-400",
          error
            ? "border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15"
            : "focus:border-primary-500 focus:ring-primary-500/15 border-gray-200 focus:ring-2",
          className,
        )}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-rose-500">{error}</p>
      )}
    </div>
  );
}

export default Input;
