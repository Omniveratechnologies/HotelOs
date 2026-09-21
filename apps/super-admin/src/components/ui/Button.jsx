const VARIANTS = {
  primary:
    "bg-primary-500 text-brand-950 hover:bg-primary-400 shadow-xs font-semibold",
  secondary:
    "bg-white text-brand-900 border border-surface-200 hover:bg-background-100",
  ghost: "text-brand-700/70 hover:text-brand-900 hover:bg-brand-950/5",
  danger: "bg-rose-600 text-white hover:bg-rose-500",
  dangerGhost: "text-rose-600 border border-rose-200 hover:bg-rose-50",
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
