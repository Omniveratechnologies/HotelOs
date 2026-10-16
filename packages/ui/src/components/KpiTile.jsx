import { cn } from "@hotelos/utils";

const DELTA_TONES = {
  up: "text-emerald-600",
  down: "text-rose-600",
  neutral: "text-surface-500",
};

/**
 * KPI stat tile: tinted rounded icon tile, big number, label and an optional
 * delta line. Renders as a clickable button when `onClick` is provided (used
 * to apply filters).
 *
 * @param {Object} props - Component properties.
 * @param {React.ComponentType<{ size?: number, className?: string }>} [props.icon] - Icon component.
 * @param {string} [props.iconClassName] - Classes for the icon tile (tints), defaults to brand.
 * @param {string|number} props.value - Primary KPI value.
 * @param {string} props.label - KPI label.
 * @param {string} [props.delta] - Small delta text, e.g. "+12% from last month".
 * @param {'up'|'down'|'neutral'} [props.deltaTone='neutral'] - Color tone of the delta.
 * @param {boolean} [props.active=false] - Highlights the tile as the applied filter.
 * @param {() => void} [props.onClick] - Makes the tile clickable.
 * @param {string} [props.className] - Extra classes.
 * @returns {React.ReactElement}
 */
export function KpiTile({
  icon: Icon,
  iconClassName = "bg-brand-50 text-brand-700",
  value,
  label,
  delta,
  deltaTone = "neutral",
  active = false,
  onClick,
  className = "",
}) {
  const interactive = typeof onClick === "function";
  const Tag = interactive ? "button" : "div";

  return (
    <Tag
      type={interactive ? "button" : undefined}
      onClick={onClick}
      aria-pressed={interactive ? active : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-white p-4 text-left shadow-2xs transition-colors",
        active ? "border-brand-600 bg-brand-50" : "border-gray-200",
        interactive &&
          "hover:border-brand-400 focus-visible:ring-brand-300 cursor-pointer focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      {Icon && (
        <span
          aria-hidden="true"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            iconClassName,
          )}
        >
          <Icon size={20} />
        </span>
      )}
      <span className="min-w-0">
        <span className="text-brand-900 block text-2xl font-semibold">
          {value}
        </span>
        <span className="text-surface-500 block truncate text-xs">{label}</span>
        {delta && (
          <span
            className={cn(
              "mt-0.5 block text-[11px] font-medium",
              DELTA_TONES[deltaTone] || DELTA_TONES.neutral,
            )}
          >
            {delta}
          </span>
        )}
      </span>
    </Tag>
  );
}

/**
 * Responsive grid wrapper for a row of {@link KpiTile}s.
 *
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - KpiTile elements.
 * @param {string} [props.className] - Extra classes.
 * @returns {React.ReactElement}
 */
export function KpiTileRow({ children, className = "" }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default KpiTile;
