import { cn } from "@hotelos/utils";

const EMPTY_SELECTS = [];

/**
 * @typedef {Object} FilterSelect
 * @property {string} key - Filter key used in change events.
 * @property {string} label - Select label (used as the placeholder option).
 * @property {{ value: string, label: string }[]} options - Options.
 * @property {string} [value] - Currently selected value.
 */

/**
 * Horizontal filter bar: date-range pickers, select filters, a search input,
 * an optional "Filters" button and a "Clear" button. Fully controlled — the
 * parent owns the plain filter object.
 *
 * @param {Object} props - Component properties.
 * @param {{ from: string, to: string }} [props.dateRange] - ISO date range; renders two date inputs when set.
 * @param {(range: { from: string, to: string }) => void} [props.onDateRangeChange] - Date-range change handler.
 * @param {FilterSelect[]} [props.selects] - Select filters to render.
 * @param {(key: string, value: string) => void} [props.onSelectChange] - Select change handler.
 * @param {string} [props.search] - Search input value.
 * @param {(value: string) => void} [props.onSearchChange] - Search change handler.
 * @param {string} [props.searchPlaceholder='Search...'] - Search placeholder.
 * @param {() => void} [props.onOpenFilters] - Renders the "Filters" button (opens extra filters).
 * @param {() => void} [props.onClear] - Renders the "Clear" button.
 * @param {string} [props.className] - Extra classes.
 * @returns {React.ReactElement}
 */
export function FilterBar({
  dateRange,
  onDateRangeChange,
  selects = EMPTY_SELECTS,
  onSelectChange,
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  onOpenFilters,
  onClear,
  className = "",
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-2xs",
        className,
      )}
    >
      {dateRange && onDateRangeChange && (
        <div className="border-surface-200 flex min-w-56 items-center gap-2 rounded-lg border bg-white px-3">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-surface-400 h-4 w-4 shrink-0"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <input
            type="date"
            aria-label="From date"
            value={dateRange.from || ""}
            onChange={(e) =>
              onDateRangeChange({ ...dateRange, from: e.target.value })
            }
            className="text-brand-900 h-10 w-full min-w-0 bg-transparent text-sm outline-none"
          />
          <span className="text-surface-400 shrink-0 text-xs">→</span>
          <input
            type="date"
            aria-label="To date"
            value={dateRange.to || ""}
            onChange={(e) =>
              onDateRangeChange({ ...dateRange, to: e.target.value })
            }
            className="text-brand-900 h-10 w-full min-w-0 bg-transparent text-sm outline-none"
          />
        </div>
      )}

      {(selects || []).map((select) => (
        <label key={select.key} className="sr-only">
          {select.label}
        </label>
      ))}

      {(selects || []).map((select) => (
        <select
          key={select.key}
          aria-label={select.label}
          value={select.value || ""}
          onChange={(e) => onSelectChange?.(select.key, e.target.value)}
          className="border-surface-200 text-brand-900 focus:border-brand-500 focus:ring-brand-200 h-10 w-40 rounded-lg border bg-white px-3 text-sm transition outline-none focus:ring-2"
        >
          <option value="">{select.label}</option>
          {(select.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {onSearchChange && (
        <div className="border-surface-200 flex min-w-52 flex-1 items-center gap-2 rounded-lg border bg-white px-3">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-surface-400 h-4 w-4 shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={search || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="text-brand-900 h-10 w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </div>
      )}

      {onOpenFilters && (
        <button
          type="button"
          onClick={onOpenFilters}
          className="border-surface-200 text-brand-900 hover:bg-background-100 flex h-10 items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium transition-colors"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path d="M3 6h18M7 12h10m-7 6h4" />
          </svg>
          Filters
        </button>
      )}

      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="text-surface-500 hover:text-brand-800 h-10 px-2 text-sm font-medium transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export default FilterBar;
