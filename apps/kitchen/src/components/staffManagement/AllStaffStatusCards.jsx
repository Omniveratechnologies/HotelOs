import { FiUsers, FiUserCheck, FiUserPlus, FiUserX } from "react-icons/fi";

import StatusCard from "../ui/StatusCard";

const AllStaffStatusCards = ({ stats }) => {
  const total = stats?.total ?? 0;
  const active = stats?.active ?? 0;
  const inactive = stats?.inactive ?? 0;
  const joinedThisMonth = stats?.joinedThisMonth ?? 0;

  const show = (value) => (stats ? value : "-");
  const percent = (count) =>
    total > 0 ? Math.round((count / total) * 100) : 0;

  const cards = [
    {
      title: "Total Staff",
      value: show(total),
      icon: <FiUsers size={20} />,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
      subtitle: "All registered staff",
      subtitleColor: "text-blue-400",
    },
    {
      title: "Active Staff",
      value: show(active),
      icon: <FiUserCheck size={20} />,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      subtitle: `${percent(active)}% of total staff`,
      subtitleColor: "text-emerald-400",
    },
    {
      title: "New This Month",
      value: show(joinedThisMonth),
      icon: <FiUserPlus size={20} />,
      iconColor: "text-orange-400",
      iconBg: "bg-orange-500/10",
      subtitle: "Joined this month",
      subtitleColor: "text-orange-400",
    },
    {
      title: "Inactive Staff",
      value: show(inactive),
      icon: <FiUserX size={20} />,
      iconColor: "text-red-400",
      iconBg: "bg-red-500/10",
      subtitle: `${percent(inactive)}% of total staff`,
      subtitleColor: "text-red-400",
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

export default AllStaffStatusCards;
