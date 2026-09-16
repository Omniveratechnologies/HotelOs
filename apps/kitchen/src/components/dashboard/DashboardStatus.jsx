import { FiShoppingBag, FiClock, FiCheckCircle, FiTruck } from "react-icons/fi";
import StatusCard from "../ui/StatusCard";

const DashboardStatus = ({ orders }) => {
  const completedOrders = orders.filter(
    (order) => order.acceptedAt && order.outForDeliveryAt,
  );

  const averagePrepTime =
    completedOrders.length > 0
      ? completedOrders.reduce((total, order) => {
          const start = new Date(order.acceptedAt);
          const end = new Date(order.outForDeliveryAt);

          return total + (end - start);
        }, 0) / completedOrders.length
      : 0;

  const averagePrepMinutes = Math.round(averagePrepTime / (1000 * 60));

  const stats = [
    {
      title: "Total Orders",
      value: orders.length,
      subtitle: `${orders.length} total`,
      icon: <FiShoppingBag size={20} />,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-950",
      subtitleColor: "text-emerald-400",
    },
    {
      title: "Preparing",
      value: orders.filter((order) => order.status === "PREPARING").length,
      subtitle: "In progress",
      icon: <FiClock size={20} />,
      iconColor: "text-yellow-400",
      iconBg: "bg-yellow-950",
      subtitleColor: "text-yellow-400",
    },
    {
      title: "Ready",
      value: orders.filter((order) => order.status === "READY").length,
      subtitle: "Ready for pickup",
      icon: <FiCheckCircle size={20} />,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-950",
      subtitleColor: "text-emerald-400",
    },
    {
      title: "Out for Delivery",
      value: orders.filter((order) => order.status === "OUT FOR DELIVERY")
        .length,
      subtitle: "On the way",
      icon: <FiTruck size={20} />,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-950",
      subtitleColor: "text-blue-400",
    },
    {
      title: "Avg. Prep Time",
      value: `${averagePrepMinutes} min`,
      subtitle: "Across completed orders",
      icon: <FiClock size={20} />,
      iconColor: "text-red-400",
      iconBg: "bg-red-950",
      subtitleColor: "text-red-400",
    },
  ];

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
      {stats.map((stat) => (
        <StatusCard
          key={stat.title}
          icon={stat.icon}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          iconColor={stat.iconColor}
          iconBg={stat.iconBg}
          subtitleColor={stat.subtitleColor}
        />
      ))}
    </div>
  );
};

export default DashboardStatus;
