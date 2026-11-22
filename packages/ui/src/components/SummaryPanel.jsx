import { cn } from "@hotelos/utils";

/**
 * @typedef {Object} SummaryLineItem
 * @property {string} label - Row label (e.g. "₹2,499 × 2 nights").
 * @property {React.ReactNode} amount - Right-aligned amount node/text.
 * @property {'default'|'discount'} [tone] - 'discount' renders green (negative) amounts.
 */

const EMPTY_ITEMS = [];

/**
 * Sticky booking/totals summary card: optional media header, line items, a
 * highlighted total row, a muted note and a slot for action buttons. Only
 * renders sections that are provided. Set `loading` for a skeleton state.
 *
 * @param {Object} props - Component properties.
 * @param {string} [props.title='Summary'] - Card title.
 * @param {React.ReactNode} [props.action] - Right-aligned header node (e.g. Edit link).
 * @param {{ src?: string, alt?: string, title: React.ReactNode, lines?: React.ReactNode[] }} [props.media] - Thumbnail block.
 * @param {SummaryLineItem[]} [props.items=[]] - Line items above the total.
 * @param {{ label: string, amount: React.ReactNode }} [props.total] - Highlighted total row.
 * @param {React.ReactNode} [props.note] - Muted helper text (e.g. cancellation policy).
 * @param {React.ReactNode} [props.footer] - Action buttons slot.
 * @param {boolean} [props.loading=false] - Renders a skeleton instead of content.
 * @param {string} [props.className] - Extra classes.
 * @returns {React.ReactElement}
 */
export function SummaryPanel({
  title = "Summary",
  action,
  media,
  items = EMPTY_ITEMS,
  total,
  note,
  footer,
  loading = false,
  className = "",
}) {
  return (
    <aside
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-5 shadow-2xs",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-brand-900 text-base font-semibold">{title}</h2>
        {action}
      </div>

      {loading ? (
        <div
          aria-busy="true"
          aria-label="Loading summary"
          className="mt-4 space-y-3"
        >
          <div className="flex gap-3">
            <div className="h-14 w-18 animate-pulse rounded-lg bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
          <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-gray-100" />
        </div>
      ) : (
        <>
          {media && (
            <div className="mt-4 flex gap-3">
              {media.src ? (
                <img
                  src={media.src}
                  alt={media.alt || ""}
                  className="h-14 w-18 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="bg-brand-50 flex h-14 w-18 shrink-0 items-center justify-center rounded-lg"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-brand-300 h-6 w-6"
                  >
                    <rect x="3" y="7" width="18" height="13" rx="2" />
                    <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-brand-900 truncate text-sm font-semibold">
                  {media.title}
                </p>
                {(media.lines || []).map((line, i) => (
                  // Lines are free-form nodes without stable ids; order is static.
                  // oxlint-disable-next-line react/no-array-index-key
                  <p key={i} className="text-surface-500 mt-0.5 text-xs">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          {items.length > 0 && (
            <dl className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              {/* Free-form label/amount nodes have no stable id; order is static. */}
              {/* oxlint-disable react/no-array-index-key */}
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-baseline justify-between gap-3"
                >
                  <dt className="text-surface-500 text-sm">{item.label}</dt>
                  <dd
                    className={cn(
                      "shrink-0 text-sm font-medium",
                      item.tone === "discount"
                        ? "text-emerald-600"
                        : "text-brand-900",
                    )}
                  >
                    {item.amount}
                  </dd>
                </div>
              ))}
              {/* oxlint-enable react/no-array-index-key */}
            </dl>
          )}

          {total && (
            <div className="bg-brand-50 mt-4 flex items-baseline justify-between rounded-lg px-4 py-3">
              <span className="text-brand-900 text-sm font-semibold">
                {total.label}
              </span>
              <span className="text-brand-800 text-lg font-bold">
                {total.amount}
              </span>
            </div>
          )}

          {note && (
            <p className="text-surface-500 mt-3 flex items-start gap-1.5 text-xs">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mt-px h-3.5 w-3.5 shrink-0"
              >
                <path d="M12 8h.01M12 12v4m9-4a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{note}</span>
            </p>
          )}

          {footer && <div className="mt-4 space-y-2">{footer}</div>}
        </>
      )}
    </aside>
  );
}

export default SummaryPanel;
