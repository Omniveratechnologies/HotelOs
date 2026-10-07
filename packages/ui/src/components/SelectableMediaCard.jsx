import { cn } from "@hotelos/utils";

/**
 * @typedef {Object} MediaCardMetaItem
 * @property {React.ComponentType<{ size?: number, className?: string }>} icon - Icon component.
 * @property {string|number} text - Meta text (e.g. capacity count).
 */

const EMPTY_META = [];

/**
 * Selectable card with a media header (used for room types): 16:9 image on
 * top, title, meta rows (capacity icons etc.), a details link, price per
 * night, a colored availability line and a full-width Select / Selected
 * button. Availability of 0 disables the card.
 *
 * @param {Object} props - Component properties.
 * @param {string} [props.imageSrc] - Image URL for the media header.
 * @param {string} [props.imageAlt=''] - Image alt text.
 * @param {string} props.title - Card title.
 * @param {MediaCardMetaItem[]} [props.meta=[]] - Small icon+text meta rows.
 * @param {() => void} [props.onViewDetails] - Renders a "View Details" link.
 * @param {React.ReactNode} [props.price] - Price node, e.g. "₹2,499".
 * @param {string} [props.priceSuffix='/ night'] - Muted suffix after the price.
 * @param {number} [props.availabilityCount] - Units available; drives the availability line.
 * @param {string} [props.availabilityLabel] - Override for the availability text.
 * @param {boolean} [props.selected=false] - Selected visual state.
 * @param {() => void} props.onSelect - Called when the Select button is clicked.
 * @param {boolean} [props.disabled=false] - Forces the disabled state.
 * @param {string} [props.className] - Extra classes.
 * @returns {React.ReactElement}
 */
export function SelectableMediaCard({
  imageSrc,
  imageAlt = "",
  title,
  meta = EMPTY_META,
  onViewDetails,
  price,
  priceSuffix = "/ night",
  availabilityCount,
  availabilityLabel,
  selected = false,
  onSelect,
  disabled = false,
  className = "",
}) {
  const soldOut = availabilityCount === 0;
  const low = !soldOut && availabilityCount != null && availabilityCount <= 3;
  const isDisabled = disabled || soldOut;

  const availabilityText =
    availabilityLabel ??
    (availabilityCount == null
      ? null
      : soldOut
        ? "Not Available"
        : `${availabilityCount} Room${availabilityCount === 1 ? "" : "s"} Available`);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-white transition-colors",
        selected
          ? "border-brand-600 bg-brand-50/40 border-2"
          : "border-gray-200",
        isDisabled && "opacity-50",
        className,
      )}
    >
      {/* Media */}
      <div className="bg-surface-100 aspect-video w-full overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={imageAlt}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="bg-brand-50 flex h-full w-full items-center justify-center"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-brand-300 h-8 w-8"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="text-brand-900 text-sm font-semibold">{title}</p>

        {meta.length > 0 && (
          <div className="text-surface-500 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {meta.map((m, i) => {
              const Icon = m.icon;
              return (
                <span
                  // Meta items are icon+text pairs without stable ids; order is static.
                  // oxlint-disable-next-line react/no-array-index-key
                  key={i}
                  className="inline-flex items-center gap-1"
                >
                  {Icon && <Icon size={12} aria-hidden="true" />}
                  {m.text}
                </span>
              );
            })}
          </div>
        )}

        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className="text-brand-700 hover:text-brand-900 self-start text-xs font-semibold underline-offset-2 hover:underline"
          >
            View Details
          </button>
        )}

        {price != null && (
          <p className="text-brand-900 mt-1 text-sm font-semibold">
            {price}{" "}
            <span className="text-surface-500 text-xs font-normal">
              {priceSuffix}
            </span>
          </p>
        )}

        {availabilityText && (
          <p
            className={cn(
              "text-xs font-medium",
              soldOut
                ? "text-rose-600"
                : low
                  ? "text-amber-600"
                  : "text-emerald-600",
            )}
          >
            {availabilityText}
          </p>
        )}

        <button
          type="button"
          disabled={isDisabled}
          onClick={onSelect}
          aria-pressed={selected}
          className={cn(
            "mt-2 h-8 w-full rounded-lg text-xs font-semibold transition-colors disabled:cursor-not-allowed",
            selected
              ? "bg-brand-700 hover:bg-brand-800 text-white"
              : "text-brand-900 border border-gray-300 bg-white hover:bg-gray-50",
          )}
        >
          {selected ? "Selected" : "Select"}
        </button>
      </div>
    </div>
  );
}

export default SelectableMediaCard;
