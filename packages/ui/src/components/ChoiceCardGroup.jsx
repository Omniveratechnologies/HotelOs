import { cn } from "@hotelos/utils";

/**
 * @typedef {Object} ChoiceOption
 * @property {string} id - Stable option identifier.
 * @property {string} title - Option title.
 * @property {string} [description] - One-line description.
 * @property {React.ReactNode} [price] - Price node, e.g. "₹2,499 / night".
 * @property {boolean} [disabled] - Disables the option.
 */

/**
 * Radio-semantics group of selectable cards (used for rate plans). The
 * selected card gets a brand border + filled radio indicator.
 *
 * @param {Object} props - Component properties.
 * @param {ChoiceOption[]} props.options - Options to render.
 * @param {string} [props.value] - Selected option id.
 * @param {(id: string) => void} props.onChange - Called with the option id on selection.
 * @param {string} [props.name] - Radio group name (for native semantics).
 * @param {string} [props.gridClassName] - Grid classes, defaults to 1/2/5 columns.
 * @param {string} [props.className] - Extra classes.
 * @returns {React.ReactElement}
 */
export function ChoiceCardGroup({
  options,
  value,
  onChange,
  name,
  gridClassName = "grid-cols-1 sm:grid-cols-2 xl:grid-cols-5",
  className = "",
}) {
  return (
    <div
      role="radiogroup"
      className={cn("grid gap-3", gridClassName, className)}
    >
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <label
            key={option.id}
            className={cn(
              "relative block cursor-pointer rounded-lg border p-3 transition-colors",
              selected
                ? "border-brand-600 bg-brand-50/60"
                : "border-gray-200 bg-white hover:border-gray-300",
              option.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={selected}
              disabled={option.disabled}
              onChange={() => !option.disabled && onChange(option.id)}
              aria-label={option.title}
            />
            <span className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  selected ? "border-brand-600" : "border-gray-300",
                )}
              >
                {selected && (
                  <span className="bg-brand-600 h-2 w-2 rounded-full" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-brand-900 block text-[13px] font-semibold">
                  {option.title}
                </span>
                {option.description && (
                  <span className="text-surface-500 mt-0.5 block text-xs">
                    {option.description}
                  </span>
                )}
                {option.price != null && (
                  <span className="text-brand-900 mt-2 block text-[13px] font-semibold">
                    {option.price}
                  </span>
                )}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

export default ChoiceCardGroup;
