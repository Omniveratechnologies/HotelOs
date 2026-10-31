import {
  FiBriefcase,
  FiCheckCircle,
  FiMinusCircle,
  FiGrid,
} from "react-icons/fi";

import StatusCard from "../ui/StatusCard";

const DesignationStatusCards = ({ stats }) => {
  const total = stats?.total ?? 0;
  const active = stats?.active ?? 0;
  const inactive = stats?.inactive ?? 0;
  const departments = stats?.departments ?? 0;

  const show = (value) => (stats ? value : "-");
  const percent = (count) =>
    total > 0 ? Math.round((count / total) * 100) : 0;

  const cards = [
    {
      title: "Total Designations",
      value: show(total),
      icon: <FiBriefcase size={20} />,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/10",
      subtitle: "Across all departments",
      subtitleColor: "text-purple-400",
    },
    {
      title: "Active Designations",
      value: show(active),
      icon: <FiCheckCircle size={20} />,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      subtitle: `${percent(active)}% of total`,
      subtitleColor: "text-emerald-400",
    },
    {
      title: "Inactive Designations",
      value: show(inactive),
      icon: <FiMinusCircle size={20} />,
      iconColor: "text-red-400",
      iconBg: "bg-red-500/10",
      subtitle: `${percent(inactive)}% of total`,
      subtitleColor: "text-red-400",
    },
    {
      title: "Departments",
      value: show(departments),
      icon: <FiGrid size={20} />,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
      subtitle: "With designations",
      subtitleColor: "text-blue-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatusCard key={card.title} {...card} />
      ))}
    </div>
  );
};

export default DesignationStatusCards;
