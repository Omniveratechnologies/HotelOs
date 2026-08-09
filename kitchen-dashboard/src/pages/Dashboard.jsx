import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";

import Navbar from "../components/Navbar";
import StatusColumn from "../components/StatusColumn";
import OrderCard from "../components/OrderCard";

import initialOrders from "../utils/order";

const Dashboard = () => {
  const [orders, setOrders] = useState(initialOrders);

  const updateStatus = (id, newStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status: newStatus } : order,
      ),
    );
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

  return (
    <div className="h-screen bg-[#0f0f0f] text-white flex flex-col overflow-hidden">
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-max px-4 lg:px-6 py-4">
          <Navbar />

          <div className="flex-1 mt-3">
            <div
              className={`grid gap-4
  grid-cols-1
  md:grid-cols-2
  ${
    statuses.length === 4
      ? "lg:grid-cols-4"
      : "lg:grid-cols-5"
  }
`}
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
