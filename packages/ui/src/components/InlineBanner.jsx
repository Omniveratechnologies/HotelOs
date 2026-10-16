import { cn } from "@hotelos/utils";

const VARIANTS = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const ICONS = {
  info: <path d="M12 8h.01M12 12v4m9-4a9 9 0 11-18 0 9 9 0 0118 0z" />,
  success: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  warning: (
    <path d="M12 9v3m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
  ),
  error: (
    <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
};

/**
 * Inline banner (info/success/warning/error) with a variant icon, text and an
 * optional trailing action node.
 *
 * @param {Object} props - Component properties.
 * @param {'info'|'success'|'warning'|'error'} [props.variant='info'] - Color scheme.
 * @param {React.ReactNode} props.children - Banner content.
 * @param {React.ReactNode} [props.action] - Optional trailing node (link/button).
 * @param {string} [props.className] - Extra classes.
 * @returns {React.ReactElement}
 */
export function InlineBanner({
  variant = "info",
  children,
  action,
  className = "",
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm",
        VARIANTS[variant] || VARIANTS.info,
        className,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 h-4 w-4 shrink-0"
      >
        {ICONS[variant] || ICONS.info}
      </svg>
      <div className="min-w-0 flex-1">{children}</div>
      {action && <div className="shrink-0 font-medium">{action}</div>}
    </div>
  );
}

export default InlineBanner;
