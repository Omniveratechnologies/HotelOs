import { cn } from "@hotelos/utils";

/**
 * Compact `[-] n [+]` numeric control with min/max clamping (used for rooms,
 * adults, children, infants).
 *
 * @param {Object} props - Component properties.
 * @param {number} props.value - Current value.
 * @param {(value: number) => void} props.onChange - Called with the clamped value.
 * @param {number} [props.min=0] - Minimum value.
 * @param {number} [props.max] - Maximum value (no upper limit when omitted).
 * @param {string} [props.label] - Optional label above the control.
 * @param {boolean} [props.disabled=false] - Disables both buttons.
 * @param {string} [props.className] - Extra classes for the wrapper.
 * @returns {React.ReactElement}
 */
export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max,
  label,
  disabled = false,
  className = "",
}) {
  const id = `qty-${String(label || "value")
    .toLowerCase()
    .replace(/\W+/g, "-")}`;
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && (max == null || value < max);

  const buttonClass =
    "flex h-10 w-10 items-center justify-center border border-gray-300 bg-white text-brand-900 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-brand-300 focus-visible:ring-2 focus-visible:outline-none";

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="text-brand-900 mb-1.5 block text-sm font-semibold"
        >
          {label}
        </label>
      )}
      <div
        className={cn("inline-flex h-10 items-center")}
        role="group"
        aria-label={label}
      >
        <button
          type="button"
          disabled={!canDecrease}
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label || "value"}`}
          className={cn(buttonClass, "rounded-l-lg")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path d="M5 12h14" />
          </svg>
        </button>
        <output
          id={id}
          aria-live="polite"
          className="border-brand-900/10 text-brand-900 flex h-10 w-12 items-center justify-center border-t border-b text-sm font-semibold"
        >
          {value}
        </output>
        <button
          type="button"
          disabled={!canIncrease}
          onClick={() =>
            onChange(max == null ? value + 1 : Math.min(max, value + 1))
          }
          aria-label={`Increase ${label || "value"}`}
          className={cn(buttonClass, "rounded-r-lg")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default QuantityStepper;
