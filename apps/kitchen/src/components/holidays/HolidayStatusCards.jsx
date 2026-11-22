import { FiCalendar, FiHome, FiSun } from "react-icons/fi";

import StatusCard from "../ui/StatusCard.jsx";

const HolidayStatusCards = ({ summary }) => {
  const stats = summary?.stats;

  return (
    <div className="flex flex-wrap gap-3" aria-label="Holiday summary">
      <StatusCard
        icon={<FiCalendar size={18} />}
        title="Total Holidays"
        value={stats?.total ?? "-"}
        subtitle={
          summary
            ? summary.isCurrentYear
              ? "This Year"
              : String(summary.year)
            : ""
        }
        iconColor="text-blue-400"
        iconBg="bg-blue-950"
        subtitleColor="text-blue-400"
      />
      <StatusCard
        icon={<FiCalendar size={18} />}
        title="Upcoming Holidays"
        value={stats?.upcoming ?? "-"}
        subtitle="Remaining"
      />
      <StatusCard
        icon={<FiSun size={18} />}
        title="Past Holidays"
        value={stats?.past ?? "-"}
        subtitle="Completed"
        iconColor="text-yellow-400"
        iconBg="bg-yellow-950"
        subtitleColor="text-yellow-400"
      />
      <StatusCard
        icon={<FiHome size={18} />}
        title="Custom Holidays"
        value={stats?.custom ?? "-"}
        subtitle="Hotel Specific"
        iconColor="text-purple-400"
        iconBg="bg-purple-950"
        subtitleColor="text-purple-400"
      />
    </div>
  );
};

export default HolidayStatusCards;
