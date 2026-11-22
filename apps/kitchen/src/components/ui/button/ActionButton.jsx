const VARIANTS = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-500",
  outline: "border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white",
  danger: "bg-red-600 text-white hover:bg-red-500",
  ghost: "text-gray-300 hover:bg-gray-800 hover:text-white",
};

const ActionButton = ({
  children,
  icon,
  onClick,
  variant = "primary",
  type = "button",
  disabled = false,
  className = "",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-50 ${
        VARIANTS[variant] || VARIANTS.primary
      } ${className}`}
    >
      {icon}
      {children}
    </button>
  );
};

export default ActionButton;