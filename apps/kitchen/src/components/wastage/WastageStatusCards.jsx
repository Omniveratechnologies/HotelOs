import { useEffect, useState } from "react";
import { FiTrash2, FiFileText, FiBarChart2 } from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import StatusCard from "../ui/StatusCard.jsx";
import API_BASE_URL from "../../config/api.js";

const WastageStatusCards = ({ refreshKey }) => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/inventory/wastage/summary?period=This Month`)
      .then((res) => res.json())
      .then((data) => setSummary(data.data))
      .catch((err) => console.error("Failed to load wastage summary:", err));
  }, [refreshKey]);

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

  const qtyChange = summary?.percentChangeQty;
  const costChange = summary?.percentChangeCost;

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <StatusCard
        icon={<FiTrash2 size={18} />}
        title="Total Wastage (This Month)"
        value={`${fmt(summary?.totalWastageQuantity)} kg`}
        subtitle={
          qtyChange !== null && qtyChange !== undefined
            ? `${qtyChange >= 0 ? "↑" : "↓"} ${Math.abs(qtyChange)}% from last month`
            : undefined
        }
        iconColor="text-red-400"
        iconBg="bg-red-950"
        subtitleColor={qtyChange >= 0 ? "text-red-400" : "text-emerald-400"}
      />

      <StatusCard
        icon={<FaRupeeSign size={16} />}
        title="Total Wastage Cost"
        value={`₹${fmt(summary?.totalWastageCost)}`}
        subtitle={
          costChange !== null && costChange !== undefined
            ? `${costChange >= 0 ? "↑" : "↓"} ${Math.abs(costChange)}% from last month`
            : undefined
        }
        iconColor="text-yellow-400"
        iconBg="bg-yellow-950"
        subtitleColor={costChange >= 0 ? "text-red-400" : "text-emerald-400"}
      />

      <StatusCard
        icon={<FiFileText size={18} />}
        title="Wastage Records"
        value={fmt(summary?.totalRecords)}
        iconColor="text-purple-400"
        iconBg="bg-purple-950"
      />

      <StatusCard
        icon={<FiBarChart2 size={18} />}
        title="Top Reason"
        value={summary?.topReason?.label || "-"}
        subtitle={
          summary?.topReason
            ? `${summary.topReason.percentOfTotal}% of total wastage`
            : undefined
        }
        iconColor="text-emerald-400"
        iconBg="bg-emerald-950"
      />
    </div>
  );
};

export default WastageStatusCards;
