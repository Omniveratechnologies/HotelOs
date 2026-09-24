import { useEffect } from "react";
import { cn } from "@hotelos/utils";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  full: "max-w-full",
};

/**
 * Accessible modal dialog component with backdrop overlay, escape-key dismissal, and scroll lock.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} [props.open=true] - Controls whether the modal is open and rendered.
 * @param {() => void} [props.onClose] - Callback invoked when the modal is closed.
 * @param {string} [props.title] - Modal header title.
 * @param {string} [props.subtitle] - Modal header subtitle.
 * @param {React.ReactNode} props.children - Modal body content.
 * @param {string} [props.className=''] - Additional CSS classes for the modal container.
 * @param {'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full'} [props.maxWidth='2xl'] - Maximum width preset.
 * @param {boolean} [props.hideCloseButton=false] - Whether to hide the top-right close button.
 * @param {boolean} [props.closeOnOverlayClick=true] - Whether clicking the backdrop overlay closes the modal.
 * @param {boolean} [props.closeOnEsc=true] - Whether pressing the Escape key closes the modal.
 * @returns {React.ReactElement | null} The rendered modal element, or null if not open.
 */
export function Modal({
  open = true,
  onClose,
  title,
  subtitle,
  children,
  className = "",
  maxWidth = "2xl",
  hideCloseButton = false,
  closeOnOverlayClick = true,
  closeOnEsc = true,
}) {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (closeOnEsc && e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, closeOnEsc]);

  if (!open) return null;

  const widthClass = SIZES[maxWidth] || maxWidth;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200"
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      {/* MODAL CONTAINER */}
      <div
        className={cn(
          "relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl transition-all duration-200",
          widthClass,
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* FIXED HEADER */}
        {(title || !hideCloseButton) && (
          <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-6 py-5">
            <div>
              {title && (
                <h2 className="font-display text-brand-900 text-xl font-semibold">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>

            {!hideCloseButton && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-brand-900 ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close modal"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
