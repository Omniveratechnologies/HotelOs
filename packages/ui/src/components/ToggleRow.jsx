import { cn } from "@hotelos/utils";

/**
 * Label + description + switch row (e.g. "Prefer specific room").
 *
 * @param {Object} props - Component properties.
 * @param {string} props.label - Row label.
 * @param {string} [props.description] - Muted helper text under the label.
 * @param {boolean} props.checked - Switch state.
 * @param {(checked: boolean) => void} props.onChange - Called on toggle.
 * @param {boolean} [props.disabled=false] - Disables the switch.
 * @param {string} [props.id] - Input id (label association).
 * @param {string} [props.className] - Extra classes.
 * @returns {React.ReactElement}
 */
export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  id,
  className = "",
}) {
  const inputId =
    id || `toggle-${String(label).toLowerCase().replace(/\W+/g, "-")}`;

  return (
    <div
      className={cn("flex items-center justify-between gap-4", className)}
      data-disabled={disabled || undefined}
    >
      <div className="min-w-0">
        <label
          htmlFor={inputId}
          className="text-brand-900 block text-sm font-semibold"
        >
          {label}
        </label>
        {description && (
          <p className="text-surface-500 mt-0.5 text-xs">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        id={inputId}
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:ring-brand-300 focus-visible:ring-2 focus-visible:outline-none",
          checked ? "bg-brand-700" : "bg-surface-300",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

export default ToggleRow;
