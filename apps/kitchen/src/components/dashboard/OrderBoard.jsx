import { useMemo } from "react";
import StatusColumn from "../ui/StatusColumn";
import OrderCard from "./OrderCard";
const OrderBoard = ({ orders, updateStatus }) => {
  const statuses = useMemo(() => {
    const base = [
      {
        title: "NEW",
        color: "bg-gray-300",
      },
      {
        title: "PREPARING",
        color: "bg-yellow-400",
      },
      {
        title: "READY",
        color: "bg-green-500",
      },
      {
        title: "OUT FOR DELIVERY",
        color: "bg-blue-500",
      },
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
    <div
      className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${
        statuses.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-5"
      }`}
    >
      {statuses.map((status) => {
        const statusOrders = orders.filter(
          (order) => order.status === status.title,
        );

        return (
          <StatusColumn
            key={status.title}
            title={status.title}
            color={status.color}
            count={statusOrders.length}
          >
            {statusOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                updateStatus={updateStatus}
              />
            ))}
          </StatusColumn>
        );
      })}
    </div>
  );
};

export default OrderBoard;
