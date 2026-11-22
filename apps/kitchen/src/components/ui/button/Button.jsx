
const variants = {
  primary:
    "bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50",
  secondary:
    "border border-gray-700 bg-[#171717] text-gray-200 hover:bg-[#222]",
  danger:
    "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20",
};

const Button = ({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  onClick,
  className = "",
}) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f] ${variants[variant] || variants.primary} ${className}`}
  >
    {children}
  </button>
);

export default Button;
