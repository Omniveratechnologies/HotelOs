const VARIANTS = {
  primary:
    "bg-signal-600 text-white hover:bg-signal-500 shadow-sm shadow-signal-600/20",
  secondary: "bg-white text-ink-body border border-line hover:bg-canvas",
  ghost: "text-ink-muted hover:text-ink-body hover:bg-ink-950/5",
  danger: "bg-rose-500 text-white hover:bg-rose-500/90",
  dangerGhost: "text-rose-500 border border-rose-500/30 hover:bg-rose-100",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  icon: Icon,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} strokeWidth={2.25} />}
      {children}
    </button>
  );
}
