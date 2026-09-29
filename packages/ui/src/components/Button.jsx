import { cn } from "@hotelos/utils";

const VARIANTS = {
  primary:
    "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-xs",
  secondary:
    "border border-gray-200 bg-white text-brand-900 hover:bg-gray-50 active:bg-gray-100 shadow-2xs",
  danger:
    "bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 shadow-xs",
  dangerGhost:
    "border border-rose-200 text-rose-600 hover:bg-rose-50 active:bg-rose-100",
  ghost: "text-brand-900 hover:bg-gray-100 active:bg-gray-200",
  outline:
    "border border-primary-500 text-primary-600 hover:bg-primary-50 active:bg-primary-100",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-lg gap-2",
  lg: "px-5 py-3 text-sm rounded-xl gap-2.5",
};

/**
 * Interactive button component supporting variants, sizes, loading states, and icons.
 *
 * @param {Object} props - Component properties.
 * @param {'primary' | 'secondary' | 'danger' | 'dangerGhost' | 'ghost' | 'outline'} [props.variant='primary'] - Visual style variant.
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Button size preset.
 * @param {'button' | 'submit' | 'reset'} [props.type='button'] - Native HTML button type.
 * @param {boolean} [props.loading=false] - Whether to show a loading spinner and disable interaction.
 * @param {boolean} [props.disabled=false] - Whether the button is disabled.
 * @param {string} [props.className=''] - Additional CSS classes for the button.
 * @param {React.ReactNode} [props.children] - Button content or label.
 * @param {React.ComponentType<{ size?: number, className?: string }>} [props.icon] - Optional Lucide or SVG icon component.
 * @returns {React.ReactElement} The rendered button element.
 */
export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  disabled = false,
  className = "",
  children,
  icon: Icon,
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-semibold transition-colors duration-150 select-none disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer";

  const variantClass = VARIANTS[variant] || VARIANTS.primary;
  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(baseClasses, variantClass, sizeClass, className)}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="h-4 w-4 shrink-0 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>
            {typeof children === "string" ? "Please wait..." : children}
          </span>
        </>
      ) : (
        <>
          {Icon && <Icon size={size === "sm" ? 14 : 16} className="shrink-0" />}
          {children}
        </>
      )}
    </button>
  );
}

export default Button;
