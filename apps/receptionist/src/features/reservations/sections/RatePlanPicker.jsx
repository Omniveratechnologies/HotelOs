import { Tag } from "lucide-react";
import { ChoiceCardGroup } from "@hotelos/ui/components";
import { formatCurrency } from "@hotelos/utils";

const MEAL_LABELS = {
  EP: "Room only",
  CP: "Breakfast included",
  MAP: "Half board (breakfast + dinner)",
  AP: "Full board (all meals)",
  BP: "Bermuda plan",
};

/**
 * Rate plan radio cards for the selected room type + occupancy.
 *
 * @param {Object} props
 * @param {{ id: string, name: string, mealPlan?: string, rate: number,
 *   roomCode?: string, occupancy?: string }[]} props.options - Rate plans.
 * @param {string} [props.value] - Selected rate plan id.
 * @param {(id: string) => void} props.onChange
 * @param {boolean} [props.loading]
 * @returns {React.ReactElement}
 */
export function RatePlanPicker({
  options,
  plans,
  value,
  onChange,
  onSelect,
  loading = false,
}) {
  const items = plans || options || [];
  const handleSelect = onSelect || onChange;

  if (loading) {
    return (
      <div>
        <p className="text-brand-900 mb-2 inline-flex items-center gap-2 text-sm font-semibold">
          <Tag size={14} /> Rate Plan
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div>
        <p className="text-brand-900 mb-2 inline-flex items-center gap-2 text-sm font-semibold">
          <Tag size={14} /> Rate Plan
        </p>
        <p className="border-surface-200 text-surface-500 rounded-lg border border-dashed px-4 py-3 text-sm">
          No rate plans for this room type — the room&apos;s standard rate will
          be used.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-brand-900 mb-2 inline-flex items-center gap-2 text-sm font-semibold">
        <Tag size={14} /> Rate Plan
      </p>
      <ChoiceCardGroup
        name="ratePlan"
        value={value}
        onChange={handleSelect}
        options={items.map((p) => ({
          id: p.id,
          title: p.name,
          description: MEAL_LABELS[p.mealPlan] || p.mealPlan || "",
          price: `${formatCurrency(p.rate)} / night`,
        }))}
      />
    </div>
  );
}

export default RatePlanPicker;
