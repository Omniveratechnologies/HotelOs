import { cn } from "@hotelos/utils";

/**
 * @typedef {Object} TabWithCount
 * @property {string} id - Stable tab identifier.
 * @property {string} label - Tab label.
 * @property {number} [count] - Optional count badge.
 */

/**
 * Underline tabs where each tab can carry a count badge, e.g. "All 128".
 * Keyboard operable via `role="tablist"` / arrow keys.
 *
 * @param {Object} props - Component properties.
 * @param {TabWithCount[]} props.tabs - Tabs to render.
 * @param {string} props.activeId - Active tab id.
 * @param {(id: string) => void} props.onChange - Called with the tab id on selection.
 * @param {string} [props.className] - Extra classes.
 * @returns {React.ReactElement}
 */
export function TabsWithCounts({ tabs, activeId, onChange, className = "" }) {
  const handleKeyDown = (e, index) => {
    let next = null;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    if (next !== null) {
      e.preventDefault();
      onChange(tabs[next].id);
    }
  };

  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-gray-200",
        className,
      )}
    >
      {tabs.map((tab, index) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none",
              active
                ? "border-brand-700 text-brand-900"
                : "text-surface-500 hover:text-brand-800 border-transparent",
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-surface-500 bg-gray-100",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TabsWithCounts;
