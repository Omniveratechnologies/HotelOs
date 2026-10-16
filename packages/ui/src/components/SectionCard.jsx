import { cn } from "@hotelos/utils";

/**
 * White section card with an optional numbered badge, title row, right-side
 * action slot and body slot. When `open` is false the body is collapsed and a
 * one-line `summary` row is shown with an optional `onEdit` link.
 *
 * @param {Object} props - Component properties.
 * @param {number|string} [props.number] - Number shown in the leading badge.
 * @param {React.ReactNode} props.title - Section title.
 * @param {React.ReactNode} [props.action] - Right-aligned node in the header row.
 * @param {React.ReactNode} [props.summary] - One-line content shown when collapsed.
 * @param {boolean} [props.open=true] - Whether the body is visible.
 * @param {boolean} [props.disabled=false] - Muted, non-interactive upcoming state.
 * @param {() => void} [props.onEdit] - Renders an Edit link in collapsed mode.
 * @param {string} [props.className] - Extra classes for the card.
 * @param {string} [props.bodyClassName] - Extra classes for the body container.
 * @param {React.ReactNode} [props.children] - Body content.
 * @returns {React.ReactElement}
 */
export function SectionCard({
  number,
  title,
  action,
  summary,
  open = true,
  disabled = false,
  onEdit,
  className = "",
  bodyClassName = "",
  children,
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-5 shadow-2xs",
        disabled && "opacity-70",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {number != null && (
          <span
            aria-hidden="true"
            className="bg-brand-700 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
          >
            {number}
          </span>
        )}
        <h2 className="text-brand-900 flex-1 text-base font-semibold">
          {title}
        </h2>
        {action ? <div className="shrink-0">{action}</div> : null}
        {!open && onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="text-brand-700 hover:text-brand-900 shrink-0 text-sm font-semibold underline-offset-2 hover:underline"
          >
            Edit
          </button>
        ) : null}
      </div>

      {open ? (
        <div className={cn("mt-4", bodyClassName)}>{children}</div>
      ) : (
        summary && (
          <div className="text-surface-600 mt-2 text-sm">{summary}</div>
        )
      )}
    </section>
  );
}

export default SectionCard;
