import { FiAlertCircle, FiShoppingCart, FiPackage } from "react-icons/fi";

import { FaRupeeSign } from "react-icons/fa";

import StatusCard from "../ui/StatusCard.jsx";

const LowStockItemsCard = ({ items = [] }) => {
  const lowStockCount = items.length;

  const criticalCount = items.filter(
    (item) => item.status === "CRITICAL",
  ).length;

  const reorderCount = items.filter(
    (item) => item.status === "LOW" || item.status === "CRITICAL",
  ).length;

  const estimatedPurchaseValue = items.reduce(
    (total, item) => total + Number(item.estimatedPurchaseValue || 0),
    0,
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatusCard
        icon={<FiPackage size={18} />}
        title="Low Stock Items"
        value={lowStockCount}
        subtitle="Items at or below minimum"
        iconColor="text-red-400"
        iconBg="bg-red-950"
        subtitleColor="text-red-400"
      />

      <StatusCard
        icon={<FiAlertCircle size={18} />}
        title="Critical Items"
        value={criticalCount}
        subtitle="Stock ≤ 25% minimum"
        iconColor="text-yellow-400"
        iconBg="bg-yellow-950"
        subtitleColor="text-yellow-400"
      />

      <StatusCard
        icon={<FiShoppingCart size={18} />}
        title="Items Need Reorder"
        value={reorderCount}
        iconColor="text-blue-400"
        iconBg="bg-blue-950"
      />

      <StatusCard
        icon={<FaRupeeSign size={18} />}
        title="Estimated Purchase Value"
        value={`₹${estimatedPurchaseValue.toLocaleString("en-IN")}`}
        subtitle="Based on current price"
        iconColor="text-emerald-400"
        iconBg="bg-emerald-950"
        subtitleColor="text-emerald-400"
      />
    </div>
  );
};

export default LowStockItemsCard;
