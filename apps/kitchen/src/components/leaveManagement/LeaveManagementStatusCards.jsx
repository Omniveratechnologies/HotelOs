import { FiCalendar, FiCheck, FiClock, FiX } from "react-icons/fi";

import StatusCard from "../ui/StatusCard.jsx";

const LeaveManagementStatusCards = ({ stats, isThisMonth = true }) => {
  const percent = (key) =>
    stats?.percent ? `${stats.percent[key] ?? 0}% of total` : "";

  return (
    <div className="flex flex-wrap gap-3">
      <StatusCard
        icon={<FiCalendar size={18} />}
        title="Total Leave Requests"
        value={stats?.total ?? "-"}
        subtitle={isThisMonth ? "This Month" : "Selected period"}
      />
      <StatusCard
        icon={<FiCheck size={18} />}
        title="Approved"
        value={stats?.approved ?? "-"}
        subtitle={percent("approved")}
        iconColor="text-blue-400"
        iconBg="bg-blue-950"
        subtitleColor="text-blue-400"
      />
      <StatusCard
        icon={<FiClock size={18} />}
        title="Pending"
        value={stats?.pending ?? "-"}
        subtitle={percent("pending")}
        iconColor="text-yellow-400"
        iconBg="bg-yellow-950"
        subtitleColor="text-yellow-400"
      />
      <StatusCard
        icon={<FiX size={18} />}
        title="Rejected"
        value={stats?.rejected ?? "-"}
        subtitle={percent("rejected")}
        iconColor="text-red-400"
        iconBg="bg-red-950"
        subtitleColor="text-red-400"
      />
    </div>
  );
};

export default LeaveManagementStatusCards;
