import { useEffect, useState } from "react";
import { FiInfo, FiCheckCircle, FiX } from "react-icons/fi";
import API_BASE_URL from "../../config/api.js";

const QuickInsightsCard = () => (
  <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
    <div className="mb-2 flex items-center gap-2">
      <FiInfo className="text-red-400" size={16} />
      <h3 className="text-sm font-semibold text-red-400">Quick Insights</h3>
    </div>
    <p className="text-xs text-gray-400">
      Expired items account for 45% of total wastage. Consider better stock
      rotation (FEFO).
    </p>
  </div>
);

const TipsCard = () => (
  <div className="bg-slate rounded-xl border border-gray-800/70 p-4">
    <h3 className="mb-3 text-sm font-semibold text-gray-200">
      Tips to Reduce Wastage
    </h3>
    <ul className="space-y-2">
      {[
        "Use FIFO/FEFO for stock rotation",
        "Monitor expiry dates regularly",
        "Order optimal quantities",
        "Store items at correct temperature",
      ].map((tip) => (
        <li key={tip} className="flex items-start gap-2 text-xs text-gray-400">
          <FiCheckCircle
            className="mt-0.5 shrink-0 text-emerald-500"
            size={13}
          />
          {tip}
        </li>
      ))}
    </ul>
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl border border-gray-800 bg-[#0f0f0f] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <FiX size={18} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const TopWastedItemsCard = ({ refreshKey }) => {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch(
      `${API_BASE_URL}/inventory/wastage/top-items?period=This Month&limit=5`,
    )
      .then((res) => res.json())
      .then((data) => setItems(data.data || []))
      .catch((err) => console.error("Failed to load top wasted items:", err));
  }, [refreshKey]);

  const maxQty = Math.max(...items.map((i) => i.quantity), 1);

  const renderList = (list) => (
    <div className="space-y-3">
      {list.map((item) => (
        <div key={item.itemName} className="flex items-center gap-3">
          <div className="w-20 shrink-0 text-xs text-gray-300">
            {item.itemName}
          </div>
          <div className="h-1.5 flex-1 rounded-full bg-gray-800">
            <div
              className="h-1.5 rounded-full bg-orange-500"
              style={{ width: `${(item.quantity / maxQty) * 100}%` }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-xs text-gray-400">
            {item.quantity} {item.unit}
          </span>
        </div>
      ))}
      {list.length === 0 && (
        <p className="text-xs text-gray-500">No data for this period.</p>
      )}
    </div>
  );

  return (
    <>
      <div className="bg-slate rounded-xl border border-gray-800/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">
            Top Wasted Items
          </h3>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-xs text-emerald-400 hover:underline"
          >
            View All
          </button>
        </div>
        {renderList(items.slice(0, 5))}
      </div>

      {showModal && (
        <Modal title="Top Wasted Items" onClose={() => setShowModal(false)}>
          {renderList(items)}
        </Modal>
      )}
    </>
  );
};

const MonthlyWastageTrendCard = ({ refreshKey }) => {
  const [trend, setTrend] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/inventory/wastage/trend?months=6`)
      .then((res) => res.json())
      .then((data) => setTrend(data.data || []))
      .catch((err) => console.error("Failed to load wastage trend:", err));
  }, [refreshKey]);

  const maxQty = Math.max(...trend.map((t) => t.quantity), 1);

  const renderBars = (list, height = "h-24") => (
    <div className={`flex items-end justify-between gap-2 ${height}`}>
      {list.map((t) => (
        <div key={t.month} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-full w-full items-end">
            <div
              className="w-full rounded-t bg-emerald-500"
              style={{ height: `${Math.max((t.quantity / maxQty) * 100, 4)}%` }}
              title={`${t.quantity} kg`}
            />
          </div>
          <span className="text-[10px] text-gray-500">{t.month}</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="bg-slate rounded-xl border border-gray-800/70 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">
            Monthly Wastage Trend
          </h3>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-xs text-emerald-400 hover:underline"
          >
            View Report
          </button>
        </div>
        {renderBars(trend)}
      </div>

      {showModal && (
        <Modal
          title="Monthly Wastage Trend"
          onClose={() => setShowModal(false)}
        >
          {renderBars(trend, "h-40")}
          <div className="mt-4 space-y-1">
            {trend.map((t) => (
              <div
                key={t.month}
                className="flex justify-between text-xs text-gray-400"
              >
                <span>{t.month}</span>
                <span>{t.quantity} kg</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
};

const WastageItems = ({ refreshKey }) => {
  return (
    <div className="space-y-4">
      <QuickInsightsCard />
      <TipsCard />
      <TopWastedItemsCard refreshKey={refreshKey} />
      <MonthlyWastageTrendCard refreshKey={refreshKey} />
    </div>
  );
};

export default WastageItems;
