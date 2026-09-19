import { useEffect } from "react";

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M6 6l12 12M18 6L6 18"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

export default function Modal({
  open = true,
  onClose,
  title,
  subtitle,
  children,
}) {
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      {/* MODAL CONTAINER */}
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
        {/* FIXED HEADER */}
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="font-display text-brand-900 text-xl font-semibold">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-brand-900 ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition hover:bg-gray-100"
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
