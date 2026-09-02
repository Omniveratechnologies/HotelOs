import { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../config/api.js";
import { AnimatePresence } from "framer-motion";

import Navbar from "../components/Navbar";
import StatusColumn from "../components/StatusColumn";
import OrderCard from "../components/OrderCard";

//import initialOrders from "../utils/order";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      const updatedOrder = await response.json();

      setOrders((prev) =>
        prev.map((order) => (order._id === id ? updatedOrder : order)),
      );
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const statuses = useMemo(() => {
    const base = [
      { title: "NEW", color: "bg-gray-300" },
      { title: "PREPARING", color: "bg-yellow-400" },
      { title: "READY", color: "bg-green-500" },
      { title: "OUT FOR DELIVERY", color: "bg-blue-500" },
    ];

    const hasRejected = orders.some((order) => order.status === "REJECTED");

    if (hasRejected) {
      base.push({
        title: "REJECTED",
        color: "bg-red-500",
      });
    }

    return base;
  }, [orders]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders`);

        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }

        const data = await response.json();

        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0f0f0f] text-white">
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-max px-4 py-4 lg:px-6">
          <Navbar />

          <div className="mt-3 flex-1">
            <div
              className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${statuses.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-5"} `}
            >
              <AnimatePresence mode="popLayout">
                {statuses.map((status) => (
                  <StatusColumn
                    key={status.title}
                    title={status.title}
                    color={status.color}
                    count={
                      orders.filter((order) => order.status === status.title)
                        .length
                    }
                  >
                    <AnimatePresence mode="popLayout">
                      {orders
                        .filter((order) => order.status === status.title)
                        .map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            updateStatus={updateStatus}
                          />
                        ))}
                    </AnimatePresence>
                  </StatusColumn>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
