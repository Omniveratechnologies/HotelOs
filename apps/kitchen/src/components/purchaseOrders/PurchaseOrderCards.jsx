import {
  FiClipboard,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiPackage,
  FiXCircle,
} from "react-icons/fi";

import StatusCard from "../ui/StatusCard.jsx";

const PurchaseOrderCards = ({ summary }) => {
  const cards = [
    {
      title: "Total POs",
      value: summary.totalOrders,
      icon: <FiClipboard size={18} />,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-950",
    },
    {
      title: "Draft",
      value: summary.draftOrders,
      icon: <FiFileText size={18} />,
      iconColor: "text-gray-400",
      iconBg: "bg-gray-900",
    },
    {
      title: "Confirmed",
      value: summary.confirmedOrders,
      icon: <FiCheckCircle size={18} />,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-950",
    },
    {
      title: "Partially Received",
      value: summary.partiallyReceivedOrders,
      icon: <FiClock size={18} />,
      iconColor: "text-yellow-400",
      iconBg: "bg-yellow-950",
    },
    {
      title: "Received",
      value: summary.receivedOrders,
      icon: <FiPackage size={18} />,
      iconColor: "text-green-400",
      iconBg: "bg-green-950",
    },
    {
      title: "Cancelled",
      value: summary.cancelledOrders,
      icon: <FiXCircle size={18} />,
      iconColor: "text-red-400",
      iconBg: "bg-red-950",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <StatusCard
          key={card.title}
          icon={card.icon}
          title={card.title}
          value={card.value}
          iconColor={card.iconColor}
          iconBg={card.iconBg}
        />
      ))}
    </div>
  );
};

export default PurchaseOrderCards;
