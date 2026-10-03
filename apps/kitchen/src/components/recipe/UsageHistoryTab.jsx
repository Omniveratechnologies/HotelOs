import { useEffect, useState } from "react";
import { FiClock, FiTrendingUp } from "react-icons/fi";
import API_BASE_URL from "../../config/api.js";

const UsageHistoryTab = ({ recipeId }) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recipeId) return;

    fetch(`${API_BASE_URL}/inventory/recipes/${recipeId}/usage-history`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setHistory(data?.data || null))
      .catch(() => setHistory(null))
      .finally(() => setLoading(false));
  }, [recipeId]);

  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-gray-500">Loading...</div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="bg-slate rounded-xl border border-gray-800/70 p-10 text-center">
        <FiClock size={32} className="mx-auto mb-3 text-gray-700" />
        <p className="text-sm font-medium text-gray-300">
          No usage history yet
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Once this recipe is linked to orders, how often it's been prepared
          will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate rounded-xl border border-gray-800/70 p-5">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
        <FiTrendingUp size={16} className="text-emerald-400" />
        Usage History
      </h2>

      <div className="space-y-3">
        {history.map((entry, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-gray-800/60 pb-3 text-sm"
          >
            <span className="text-gray-300">{entry.date}</span>
            <span className="text-gray-400">
              {entry.quantityPrepared} servings
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsageHistoryTab;
