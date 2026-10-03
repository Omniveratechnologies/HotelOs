import { FiPieChart } from "react-icons/fi";
import CostSummaryCard from "./CostSummaryCard.jsx";
import ProfitabilityAnalysisCard from "./ProfitabilityAnalysisCard.jsx";

const CostProfitabilityTab = ({ form, onChange }) => {
  const ingredients = form.ingredients || [];

  const totalIngredientCost = ingredients.reduce(
    (sum, ingredient) => sum + Number(ingredient.totalCost || 0),
    0,
  );

  const maxCost = Math.max(
    ...ingredients.map((ingredient) => Number(ingredient.totalCost || 0)),
    1,
  );

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
      <div className="bg-slate rounded-xl border border-gray-800/70 p-5">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
          <FiPieChart size={16} className="text-emerald-400" />
          Ingredient Cost Breakdown
        </h2>

        {ingredients.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            Add ingredients in the Recipe Details tab to see the cost breakdown.
          </p>
        ) : (
          <div className="space-y-3">
            {ingredients.map((ingredient, index) => {
              const totalCost = Number(ingredient.totalCost || 0);

              const itemName =
                ingredient.inventoryItem?.name ||
                ingredient.inventoryItemName ||
                "Ingredient";

              const percentage = (totalCost / maxCost) * 100;

              return (
                <div
                  key={ingredient._id || index}
                  className="flex items-center gap-3"
                >
                  <span className="w-32 shrink-0 truncate text-xs text-gray-300">
                    {itemName}
                  </span>

                  <div className="h-2 flex-1 rounded-full bg-gray-800">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <span className="w-16 shrink-0 text-right text-xs text-gray-400">
                    ₹{totalCost.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-gray-800 pt-4 text-sm">
          <span className="text-gray-400">Total Ingredient Cost</span>

          <span className="font-semibold text-white">
            ₹{totalIngredientCost.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="space-y-5">
        <CostSummaryCard form={form} onChange={onChange} />

        <ProfitabilityAnalysisCard form={form} />
      </div>
    </div>
  );
};

export default CostProfitabilityTab;
