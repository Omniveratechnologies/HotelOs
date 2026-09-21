import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="bg-brand-950/60 fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      {/* MODAL CONTAINER */}
      <div className="border-surface-200 relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
        {/* FIXED HEADER */}
        <div className="border-surface-200 flex shrink-0 items-start justify-between border-b px-6 py-5">
          <div>
            <h2 className="font-display text-brand-900 text-xl font-semibold">
              {title}
            </h2>

            {subtitle && (
              <p className="text-brand-700/60 mt-1 text-sm">{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-brand-700/60 hover:bg-background-100 hover:text-brand-900 ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
