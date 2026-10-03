import { useEffect, useState } from "react";
import { FiShoppingBag } from "react-icons/fi";
import Table from "../ui/Table.jsx";
import StatusBadge from "../ui/StatusBadge.jsx";
import API_BASE_URL from "../../config/api.js";

const LinkedOrdersTab = ({ recipeId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recipeId) return;

    fetch(`${API_BASE_URL}/inventory/recipes/${recipeId}/orders`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setOrders(data?.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [recipeId]);

  const columns = [
    { key: "orderNumber", label: "Order #" },
    { key: "date", label: "Date" },
    { key: "quantity", label: "Qty" },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-gray-500">Loading...</div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-slate rounded-xl border border-gray-800/70 p-10 text-center">
        <FiShoppingBag size={32} className="mx-auto mb-3 text-gray-700" />
        <p className="text-sm font-medium text-gray-300">
          No linked orders yet
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Orders that include this menu item will be listed here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate rounded-xl border border-gray-800/70 p-5">
      <h2 className="mb-4 text-base font-semibold text-white">Linked Orders</h2>
      <Table columns={columns} data={orders} emptyMessage="No linked orders" />
    </div>
  );
};

export default LinkedOrdersTab;
