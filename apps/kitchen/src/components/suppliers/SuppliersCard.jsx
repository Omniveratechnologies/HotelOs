import { useEffect, useState } from "react";
import { FiUsers, FiUserCheck, FiUserX, FiShoppingCart } from "react-icons/fi";
import StatusCard from "../ui/StatusCard.jsx";
import API_BASE_URL from "../../config/api.js";

const SuppliersCard = () => {
  const [summary, setSummary] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    inactiveSuppliers: 0,
    totalPurchaseValue: 0,
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/inventory/suppliers/summary`,
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch supplier summary");
        }

        setSummary(data.data || data);
      } catch (error) {
        console.error("Supplier summary error:", error);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="flex gap-4">
      <StatusCard
        icon={<FiUsers size={20} />}
        title="Total Suppliers"
        value={summary.totalSuppliers}
        iconColor="text-blue-400"
        iconBg="bg-blue-950"
      />

      <StatusCard
        icon={<FiUserCheck size={20} />}
        title="Active Suppliers"
        value={summary.activeSuppliers}
        iconColor="text-emerald-400"
        iconBg="bg-emerald-950"
      />

      <StatusCard
        icon={<FiUserX size={20} />}
        title="Inactive Suppliers"
        value={summary.inactiveSuppliers}
        iconColor="text-red-400"
        iconBg="bg-red-950"
      />

      <StatusCard
        icon={<FiShoppingCart size={20} />}
        title="Purchase Value This Month"
        value={`₹${summary.totalPurchaseValue.toLocaleString("en-IN")}`}
        iconColor="text-yellow-400"
        iconBg="bg-yellow-950"
      />
    </div>
  );
};

export default SuppliersCard;
