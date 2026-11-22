import { Users, BedDouble, Search } from "lucide-react";
import { SectionCard, SelectableMediaCard } from "@hotelos/ui/components";
import { formatCurrency } from "@hotelos/utils";

/**
 * Wizard step 2 top block — room type cards with live availability.
 *
 * @param {Object} props
 * @param {{ roomTypeCode: string, name: string, available?: number,
 *   totalRooms?: number, price?: number|null, occupancyMax?: number|null }[]} props.items - Room types merged with availability.
 * @param {string} [props.value] - Selected roomTypeCode.
 * @param {(code: string) => void} props.onSelect
 * @param {{ checkIn: string, checkOut: string, nights: number }} props.range - Displayed range.
 * @param {() => void} [props.onModifySearch] - "Modify Search" action.
 * @param {boolean} [props.loading]
 * @param {boolean} [props.open] @param {string} [props.summary] @param {() => void} [props.onEdit]
 * @returns {React.ReactElement}
 */
export function RoomTypePicker({
  items,
  value,
  onSelect,
  range,
  onModifySearch,
  loading = false,
  open = true,
  summary,
  onEdit,
}) {
  return (
    <SectionCard
      number="2"
      title="Select Room"
      open={open}
      summary={summary}
      onEdit={onEdit}
      action={
        <div className="flex items-center gap-4">
          <span className="text-surface-500 hidden text-xs sm:block">
            {range.checkIn && range.checkOut
              ? `${range.checkIn} → ${range.checkOut} (${range.nights} night${range.nights === 1 ? "" : "s"})`
              : "Select dates first"}
          </span>
          {onModifySearch && (
            <button
              type="button"
              onClick={onModifySearch}
              className="text-brand-700 hover:text-brand-900 inline-flex items-center gap-1 text-xs font-semibold"
            >
              <Search size={12} /> Modify Search
            </button>
          )}
        </div>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="aspect-4/3 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-surface-500 py-6 text-center text-sm">
          No room types configured. Add room types in Inventory → Room Types.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {items.map((item) => (
            <SelectableMediaCard
              key={item.roomTypeCode}
              title={item.name}
              meta={[
                { icon: Users, text: item.occupancyMax ?? "—" },
                { icon: BedDouble, text: `${item.totalRooms ?? 0} rooms` },
              ]}
              price={item.price != null ? formatCurrency(item.price) : null}
              availabilityCount={item.available}
              selected={value === item.roomTypeCode}
              onSelect={() => onSelect(item.roomTypeCode)}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export default RoomTypePicker;
