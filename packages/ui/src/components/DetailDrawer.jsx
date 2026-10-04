import { useEffect } from "react";
import { cn } from "@hotelos/utils";

/**
 * @typedef {Object} DrawerTab
 * @property {string} id - Stable tab identifier.
 * @property {string} label - Tab label.
 */

/**
 * Right-side detail panel. `overlay` slides over the page with a dimmed
 * backdrop (Esc / backdrop click closes); `docked` renders inline for use in
 * page flex layouts. Has a sticky header, optional tab strip, scrollable body
 * and a sticky footer for actions.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} props.open - Whether the panel is visible.
 * @param {() => void} [props.onClose] - Close handler (overlay variant).
 * @param {'overlay'|'docked'} [props.variant='overlay'] - Rendering mode.
 * @param {React.ReactNode} [props.header] - Custom header content; falls back to title/subtitle.
 * @param {React.ReactNode} [props.title] - Header title (16px semibold).
 * @param {React.ReactNode} [props.subtitle] - Secondary line under the title.
 * @param {DrawerTab[]} [props.tabs] - Optional tab strip.
 * @param {string} [props.activeTabId] - Active tab id.
 * @param {(id: string) => void} [props.onTabChange] - Tab change handler.
 * @param {React.ReactNode} props.children - Scrollable body content.
 * @param {React.ReactNode} [props.footer] - Sticky footer actions.
 * @param {string} [props.widthClassName='w-full max-w-[440px]'] - Width utility for the panel.
 * @param {string} [props.className] - Extra classes for the panel.
 * @returns {React.ReactElement | null}
 */
export function DetailDrawer({
  open,
  onClose,
  variant = "overlay",
  header,
  title,
  subtitle,
  tabs,
  activeTabId,
  onTabChange,
  children,
  footer,
  widthClassName = "w-full max-w-[440px]",
  className = "",
}) {
  useEffect(() => {
    if (!open || variant !== "overlay") return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, variant, onClose]);

  if (!open) return null;

  const panel = (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden bg-white",
        variant === "overlay"
          ? "border-l border-gray-200 shadow-2xl"
          : "rounded-xl border border-gray-200 shadow-2xs",
        widthClassName,
        className,
      )}
    >
      {/* Sticky header */}
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-4 py-4">
        {header || (
          <div className="min-w-0">
            {title && (
              <h2 className="text-brand-900 truncate text-base font-semibold">
                {title}
              </h2>
            )}
            {subtitle && (
              <div className="text-surface-500 mt-0.5 text-sm">{subtitle}</div>
            )}
          </div>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="text-surface-400 focus-visible:ring-brand-300 shrink-0 rounded-lg p-1.5 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-2 focus-visible:outline-none"
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

      {/* Optional tab strip */}
      {tabs?.length > 0 && (
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-gray-100 px-4">
          {tabs.map((tab) => {
            const active = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTabChange?.(tab.id)}
                className={cn(
                  "-mb-px border-b-2 px-2 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-brand-700 text-brand-900"
                    : "text-surface-500 hover:text-brand-800 border-transparent",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>

      {/* Sticky footer */}
      {footer && (
        <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );

  if (variant === "docked") {
    return panel;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="h-full max-h-full" onClick={(e) => e.stopPropagation()}>
        {panel}
      </div>
    </div>
  );
}

export default DetailDrawer;
