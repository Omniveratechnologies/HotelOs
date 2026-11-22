import { FiCalendar, FiCheck, FiClock, FiSend, FiX } from "react-icons/fi";

import StatusCard from "../ui/StatusCard";
import { formatNumber } from "../../utils/attendanceFormat.js";

const AttendanceStatusCards = ({ stats }) => {
  const value = (key) => (stats ? formatNumber(stats[key]) : "-");
  const share = (key) => (stats ? `${stats.percent[key]}% of total` : "");

  return (
    <section
      aria-label="Attendance summary"
      className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"
    >
      <StatusCard
        title="Total Records"
        value={value("total")}
        subtitle="In selected range"
        icon={<FiCalendar size={18} />}
        iconColor="text-blue-400"
        iconBg="bg-blue-500/10"
        subtitleColor="text-blue-400"
      />
      <StatusCard
        title="Present"
        value={value("present")}
        subtitle={share("present")}
        icon={<FiCheck size={18} />}
        iconColor="text-emerald-400"
        iconBg="bg-emerald-500/10"
        subtitleColor="text-emerald-400"
      />
      <StatusCard
        title="Late"
        value={value("late")}
        subtitle={share("late")}
        icon={<FiClock size={18} />}
        iconColor="text-yellow-400"
        iconBg="bg-yellow-500/10"
        subtitleColor="text-yellow-400"
      />
      <StatusCard
        title="Absent"
        value={value("absent")}
        subtitle={share("absent")}
        icon={<FiX size={18} />}
        iconColor="text-red-400"
        iconBg="bg-red-500/10"
        subtitleColor="text-red-400"
      />
      <StatusCard
        title="On Leave"
        value={value("onLeave")}
        subtitle={share("onLeave")}
        icon={<FiSend size={18} />}
        iconColor="text-purple-400"
        iconBg="bg-purple-500/10"
        subtitleColor="text-purple-400"
      />
    </section>
  );
};

export default AttendanceStatusCards;
