import { useEffect, useState } from "react";
import { FiX, FiAlertTriangle } from "react-icons/fi";
import API_BASE_URL from "../../config/api.js";

const ViewAllModal = ({ title, items, onClose }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4"
    onClick={onClose}
  >
    <div
      className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl border border-gray-800 bg-[#111111] shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-800 hover:text-white"
        >
          <FiX size={18} />
        </button>
      </div>

      <div className="space-y-3 p-5">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing to show.</p>
        ) : (
          items.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-300">{item.name}</span>
              <span className="font-medium text-red-400">
                {item.currentStock} {item.unit} left
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

const LowStockAlertsCard = ({ refreshKey }) => {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/inventory/low-stock`)
      .then((res) => res.json())
      .then((data) => setItems(data.data || []))
      .catch((err) => console.error("Failed to load low stock items:", err));
  }, [refreshKey]);

  return (
    <>
      <div className="bg-slate rounded-xl border border-gray-800/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
            <FiAlertTriangle className="text-red-400" size={14} />
            Low Stock Alerts
          </h3>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-xs text-emerald-400 hover:underline"
          >
            View All
          </button>
        </div>

        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-xs text-gray-500">
              All items are above minimum stock.
            </p>
          ) : (
            items.slice(0, 5).map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-gray-300">{item.name}</span>
                <span className="font-medium text-red-400">
                  {item.currentStock} {item.unit} left
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <ViewAllModal
          title="Low Stock Alerts"
          items={items}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default LowStockAlertsCard;
