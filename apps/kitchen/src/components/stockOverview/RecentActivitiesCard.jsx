import { useEffect, useState } from "react";
import { FiArrowUp, FiArrowDown, FiX } from "react-icons/fi";
import API_BASE_URL from "../../config/api.js";

const timeAgo = (date) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 60) {
    return `${diffMin} min${diffMin !== 1 ? "s" : ""} ago`;
  }

  const diffHr = Math.round(diffMin / 60);

  if (diffHr < 24) {
    return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  }

  const diffDay = Math.round(diffHr / 24);

  return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
};

const ActivityRow = ({ activity }) => {
  const isReceived = activity.activityType === "RECEIVED";

  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isReceived
            ? "bg-emerald-950 text-emerald-400"
            : "bg-orange-950 text-orange-400"
        }`}
      >
        {isReceived ? <FiArrowDown size={13} /> : <FiArrowUp size={13} />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-gray-200">
          {isReceived ? "Stock Received" : "Stock Used"} — {activity.itemName}
        </p>

        <p className="text-[10px] text-gray-500">
          {activity.quantity} {activity.unit}
        </p>
      </div>

      <span className="shrink-0 text-[10px] text-gray-500">
        {timeAgo(activity.date)}
      </span>
    </div>
  );
};

const ViewAllModal = ({ activities, onClose }) => (
  <div
    className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 px-4"
    onClick={onClose}
  >
    <div
      className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl border border-gray-800 bg-[#111111] shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
        <h2 className="text-base font-semibold text-white">
          Recent Stock Activities
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-800 hover:text-white"
        >
          <FiX size={18} />
        </button>
      </div>

      <div className="space-y-4 p-5">
        {activities.map((activity) => (
          <ActivityRow
            key={`${activity.activityType}-${activity._id}`}
            activity={activity}
          />
        ))}
      </div>
    </div>
  </div>
);

const RecentActivitiesCard = ({ refreshKey }) => {
  const [activities, setActivities] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const [purchaseRes, usageRes] = await Promise.all([
          fetch(`${API_BASE_URL}/inventory/purchase-history`),
          fetch(`${API_BASE_URL}/inventory/usage`),
        ]);

        const purchaseData = await purchaseRes.json();
        const usageData = await usageRes.json();

        if (!purchaseRes.ok || !usageRes.ok) {
          throw new Error("Failed to load inventory activities");
        }

        const purchases = Array.isArray(purchaseData.data)
          ? purchaseData.data
          : [];

        const usage = Array.isArray(usageData.data) ? usageData.data : [];

        const purchaseActivities = purchases.map((item) => ({
          _id: item._id,
          activityType: "RECEIVED",
          itemName: item.inventoryItem?.name || "Unknown Item",
          quantity: item.quantity || 0,
          unit: item.unit || item.inventoryItem?.unit || "",
          date: item.createdAt || item.purchaseDate,
        }));

        const usageActivities = usage.map((item) => ({
          _id: item._id,
          activityType: "USED",
          itemName: item.inventoryItem?.name || "Unknown Item",
          quantity: item.quantityUsed || 0,
          unit: item.unit || item.inventoryItem?.unit || "",
          date: item.createdAt || item.usedDate,
        }));

        const combinedActivities = [...purchaseActivities, ...usageActivities]
          .toSorted((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 20);

        setActivities(combinedActivities);
      } catch (error) {
        console.error("Failed to load recent activities:", error);
        setActivities([]);
      }
    };

    fetchActivities();
  }, [refreshKey]);

  return (
    <>
      <div className="bg-slate rounded-xl border border-gray-800/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">
            Recent Stock Activities
          </h3>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-xs text-emerald-400 hover:underline"
          >
            View All
          </button>
        </div>

        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-xs text-gray-500">No recent activity.</p>
          ) : (
            activities
              .slice(0, 5)
              .map((activity) => (
                <ActivityRow
                  key={`${activity.activityType}-${activity._id}`}
                  activity={activity}
                />
              ))
          )}
        </div>
      </div>

      {showModal && (
        <ViewAllModal
          activities={activities}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default RecentActivitiesCard;
