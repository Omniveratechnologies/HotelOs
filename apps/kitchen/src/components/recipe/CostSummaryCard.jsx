import { FiInfo } from "react-icons/fi";

const CostSummaryCard = ({ form, onChange }) => {
  const totalIngredientCost = (form.ingredients || []).reduce(
    (sum, i) => sum + Number(i.totalCost || 0),
    0,
  );
  const packagingCost = Number(form.packagingCost || 0);
  const preparationOverhead = Number(form.preparationOverhead || 0);
  const totalFoodCost =
    totalIngredientCost + packagingCost + preparationOverhead;

  return (
    <div className="bg-slate rounded-xl border border-gray-800/70 p-4">
      <h3 className="mb-4 text-sm font-semibold text-gray-200">
        Cost Summary (per serving)
      </h3>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Total Ingredient Cost</span>
          <span className="font-medium text-gray-200">
            ₹{totalIngredientCost.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-gray-500">
            Packaging Cost
            <FiInfo size={11} className="text-gray-600" />
          </span>
          <input
            type="number"
            name="packagingCost"
            value={form.packagingCost}
            onChange={onChange}
            className="w-20 rounded border border-gray-700 bg-[#0f0f0f] px-2 py-1 text-right text-xs text-white outline-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-gray-500">
            Preparation Overhead
            <FiInfo size={11} className="text-gray-600" />
          </span>
          <input
            type="number"
            name="preparationOverhead"
            value={form.preparationOverhead}
            onChange={onChange}
            className="w-20 rounded border border-gray-700 bg-[#0f0f0f] px-2 py-1 text-right text-xs text-white outline-none"
          />
        </div>

        <div className="flex items-center justify-between border-t border-gray-800 pt-3">
          <span className="font-semibold text-gray-200">Total Food Cost</span>
          <span className="text-base font-bold text-white">
            ₹{totalFoodCost.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CostSummaryCard;
