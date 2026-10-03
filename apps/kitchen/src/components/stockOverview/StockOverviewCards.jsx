import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiBox,
  FiCheckCircle,
  FiDollarSign,
  FiXCircle,
} from "react-icons/fi";

import API_BASE_URL from "../../config/api";
import StatusCard from "../ui/StatusCard";

const StockOverviewCards = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/inventory/items`);

        if (!response.ok) {
          throw new Error("Failed to fetch inventory items");
        }

        const result = await response.json();

        setItems(result.data || result);
      } catch (error) {
        console.error("Failed to load inventory overview:", error);
      }
    };

    fetchInventoryItems();
  }, []);

  const totalItems = items.length;

  const inStock = items.filter(
    (item) => Number(item.currentStock || 0) > Number(item.minimumStock || 0),
  ).length;

  const lowStock = items.filter(
    (item) =>
      Number(item.currentStock || 0) > 0 &&
      Number(item.currentStock || 0) <= Number(item.minimumStock || 0),
  ).length;

  const outOfStock = items.filter(
    (item) => Number(item.currentStock || 0) <= 0,
  ).length;

  const totalInventoryValue = items.reduce(
    (total, item) =>
      total + Number(item.currentStock || 0) * Number(item.costPerUnit || 0),
    0,
  );

  return (
    <div className="flex gap-3">
      <StatusCard
        icon={<FiBox size={19} />}
        title="Total Items"
        value={totalItems}
        subtitle="All inventory items"
        iconColor="text-blue-400"
        iconBg="bg-blue-950"
        subtitleColor="text-gray-500"
      />

      <StatusCard
        icon={<FiCheckCircle size={19} />}
        title="In Stock"
        value={inStock}
        subtitle="Above minimum level"
        iconColor="text-emerald-400"
        iconBg="bg-emerald-950"
        subtitleColor="text-emerald-400"
      />

      <StatusCard
        icon={<FiAlertTriangle size={19} />}
        title="Low Stock"
        value={lowStock}
        subtitle="Needs attention"
        iconColor="text-yellow-400"
        iconBg="bg-yellow-950"
        subtitleColor="text-yellow-400"
      />

      <StatusCard
        icon={<FiXCircle size={19} />}
        title="Out of Stock"
        value={outOfStock}
        subtitle="Reorder needed"
        iconColor="text-red-400"
        iconBg="bg-red-950"
        subtitleColor="text-red-400"
      />

      <StatusCard
        icon={<FiDollarSign size={19} />}
        title="Total Inventory Value"
        value={`₹${totalInventoryValue.toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })}`}
        subtitle="Current stock value"
        iconColor="text-purple-400"
        iconBg="bg-purple-950"
        subtitleColor="text-purple-400"
      />
    </div>
  );
};

export default StockOverviewCards;
