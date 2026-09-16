import {
  FiShoppingBag,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import { RiMoneyRupeeCircleFill } from "react-icons/ri";

import StatusCard from "../ui/StatusCard";

const OrderStatusCards = ({ orders = [] }) => {
  const totalRevenue = orders.reduce((total, order) => {
    return total + Number(order.totalAmount || order.amount || 0);
  }, 0);

  const stats = [
    {
      title: "Total Orders",
      value: orders.length,
      icon: <FiShoppingBag size={20} />,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-950",
    },
    {
      title: "In Progress",
      value: orders.filter((order) => order.status === "PREPARING").length,
      icon: <FiClock size={20} />,
      iconColor: "text-yellow-400",
      iconBg: "bg-yellow-950",
    },
    {
      title: "Delivered",
      value: orders.filter((order) => order.status === "DELIVERED").length,
      icon: <FiCheckCircle size={20} />,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-950",
    },
    {
      title: "Cancelled",
      value: orders.filter((order) => order.status === "REJECTED").length,
      icon: <FiXCircle size={20} />,
      iconColor: "text-red-400",
      iconBg: "bg-red-950",
    },
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
      icon: <RiMoneyRupeeCircleFill size={20} />,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-950",
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

export default OrderStatusCards;
