import { cn } from "@hotelos/utils";

/**
 * Empty-state block: icon, title, hint text and an optional primary action.
 *
 * @param {Object} props - Component properties.
 * @param {React.ComponentType<{ size?: number, className?: string }>} [props.icon] - Icon component.
 * @param {string} props.title - Empty-state title.
 * @param {string} [props.hint] - Helper text under the title.
 * @param {React.ReactNode} [props.action] - Optional action node (e.g. a Button).
 * @param {string} [props.className] - Extra classes.
 * @returns {React.ReactElement}
 */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  className = "",
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <span
          aria-hidden="true"
          className="text-surface-400 mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100"
        >
          <Icon size={24} />
        </span>
      )}
      <p className="text-brand-900 text-sm font-semibold">{title}</p>
      {hint && <p className="text-surface-500 mt-1 max-w-sm text-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
