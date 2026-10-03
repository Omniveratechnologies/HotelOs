import { FiInfo, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";

const ProfitabilityAnalysisCard = ({ form }) => {
  const totalIngredientCost = (form.ingredients || []).reduce(
    (sum, i) => sum + Number(i.totalCost || 0),
    0,
  );
  const totalFoodCost =
    totalIngredientCost +
    Number(form.packagingCost || 0) +
    Number(form.preparationOverhead || 0);
  const sellingPrice = Number(form.sellingPrice || 0);

  const profitPerServing = sellingPrice - totalFoodCost;
  const foodCostPercent =
    sellingPrice > 0 ? (totalFoodCost / sellingPrice) * 100 : 0;
  const profitMarginPercent =
    sellingPrice > 0 ? (profitPerServing / sellingPrice) * 100 : 0;

  const isGoodMargin = foodCostPercent > 0 && foodCostPercent <= 35;
  const hasData = sellingPrice > 0 && totalFoodCost > 0;

  return (
    <div className="bg-slate rounded-xl border border-gray-800/70 p-4">
      <h3 className="mb-4 text-sm font-semibold text-gray-200">
        Profitability Analysis
      </h3>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Selling Price (per serving)</span>
          <span className="font-medium text-gray-200">
            ₹{sellingPrice.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-500">Food Cost</span>
          <span className="font-medium text-gray-200">
            ₹{totalFoodCost.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-200">
            Profit per Serving
          </span>
          <span
            className={`text-base font-bold ${profitPerServing >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            ₹{profitPerServing.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-gray-500">
            Food Cost %
            <FiInfo size={11} className="text-gray-600" />
          </span>
          <span className="font-medium text-gray-200">
            {foodCostPercent.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-gray-500">
            Profit Margin %
            <FiInfo size={11} className="text-gray-600" />
          </span>
          <span className="font-medium text-gray-200">
            {profitMarginPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {hasData && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-lg border p-3 text-xs ${
            isGoodMargin
              ? "border-emerald-900 bg-emerald-950/40 text-emerald-400"
              : "border-yellow-900 bg-yellow-950/40 text-yellow-400"
          }`}
        >
          {isGoodMargin ? (
            <FiCheckCircle size={14} className="mt-0.5 shrink-0" />
          ) : (
            <FiAlertTriangle size={14} className="mt-0.5 shrink-0" />
          )}
          <div>
            <p className="font-semibold">
              {isGoodMargin ? "Good Profit Margin!" : "Margin Needs Attention"}
            </p>
            <p className="mt-0.5 opacity-80">
              {isGoodMargin
                ? "Your food cost is under control."
                : "Consider raising the price or reducing ingredient cost."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitabilityAnalysisCard;
