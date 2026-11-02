import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-lg",
}) => {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const opener = document.activeElement;
    const dialog = dialogRef.current;

    const focusables = dialog
      ? Array.from(dialog.querySelectorAll(FOCUSABLE))
      : [];
    const first =
      focusables.find((element) => element.dataset.close === undefined) ||
      focusables[0];
    first?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      const items = Array.from(dialog.querySelectorAll(FOCUSABLE));
      if (items.length === 0) return;

      const firstItem = items[0];
      const lastItem = items[items.length - 1];

      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-xl border border-gray-800 bg-[#151515] text-white shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            type="button"
            data-close
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-800 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
