import { cn } from "@hotelos/utils";

const VARIANTS = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  "checked-in": "bg-blue-50 text-blue-700 border-blue-200",
  "checked-out": "border-gray-200 bg-gray-50 text-gray-600",
  cancelled: "bg-rose-50 text-rose-600 border-rose-200",
  rejected: "bg-rose-50 text-rose-600 border-rose-200",
  expired: "bg-rose-50 text-rose-600 border-rose-200",
  draft: "border-gray-300 bg-white text-gray-600",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "border-gray-200 bg-gray-50 text-gray-600",
};

/**
 * Pill status chip with a fixed variant → color mapping. Always carries text
 * (color is never the only status indicator).
 *
 * @param {Object} props - Component properties.
 * @param {'confirmed'|'approved'|'pending'|'checked-in'|'checked-out'|'cancelled'|'rejected'|'expired'|'draft'|'info'|'neutral'} [props.variant='neutral'] - Color scheme.
 * @param {React.ReactNode} props.children - Chip label text.
 * @param {boolean} [props.dot=true] - Shows a small status dot before the label.
 * @param {string} [props.className] - Extra classes.
 * @returns {React.ReactElement}
 */
export function StatusChip({
  variant = "neutral",
  children,
  dot = true,
  className = "",
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap",
        VARIANTS[variant] || VARIANTS.neutral,
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-current"
        />
      )}
      {children}
    </span>
  );
}

export default StatusChip;
