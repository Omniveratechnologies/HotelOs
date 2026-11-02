import { FiCalendar, FiClock, FiUserX, FiUsers } from "react-icons/fi";

import StatusCard from "../ui/StatusCard.jsx";

const ShiftscheduleStatusCards = ({ stats, isToday = true }) => {
  const of = (key) => (stats ? `${stats.percent[key]}% of staff` : "");
  const day = isToday ? "Today" : "That day";

  return (
    <div className="flex flex-wrap gap-3" aria-label="Shift summary">
      <StatusCard
        icon={<FiUsers size={18} />}
        title="Total Shifts"
        value={stats?.totalShifts ?? "-"}
        subtitle="Active shifts"
        iconColor="text-purple-400"
        iconBg="bg-purple-950"
        subtitleColor="text-purple-400"
      />
      <StatusCard
        icon={<FiCalendar size={18} />}
        title={`Assigned ${day}`}
        value={stats?.assignedToday ?? "-"}
        subtitle={of("assigned")}
      />
      <StatusCard
        icon={<FiClock size={18} />}
        title="On Duty Now"
        value={stats?.onDutyNow ?? "-"}
        subtitle={of("onDuty")}
        iconColor="text-yellow-400"
        iconBg="bg-yellow-950"
        subtitleColor="text-yellow-400"
      />
      <StatusCard
        icon={<FiUserX size={18} />}
        title="Off Duty"
        value={stats?.offDuty ?? "-"}
        subtitle={of("offDuty")}
        iconColor="text-red-400"
        iconBg="bg-red-950"
        subtitleColor="text-red-400"
      />
    </div>
  );
};

export default ShiftscheduleStatusCards;
