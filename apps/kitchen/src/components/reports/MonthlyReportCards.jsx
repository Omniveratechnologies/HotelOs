import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";

import StatusCard from "../ui/StatusCard.jsx";
import {
  formatCount,
  percentText,
  trendText,
} from "../../utils/monthlyReportUtils.js";

const MonthlyReportCards = ({ kpis }) => {
  const days = (metric) => (metric ? formatCount(metric.value) : "-");

  return (
    <div className="flex flex-wrap gap-3" aria-label="Monthly summary">
      <StatusCard
        icon={<FiUsers size={18} />}
        title="Total Staff"
        value={kpis ? formatCount(kpis.totalStaff) : "-"}
        subtitle="Active staff"
        iconColor="text-blue-400"
        iconBg="bg-blue-950"
        subtitleColor="text-blue-400"
      />
      <StatusCard
        icon={<FiCheckCircle size={18} />}
        title="Average Attendance"
        value={kpis ? percentText(kpis.averageAttendance.value) : "-"}
        subtitle={kpis ? trendText(kpis.averageAttendance) : ""}
        iconColor="text-emerald-400"
        iconBg="bg-emerald-950"
        subtitleColor="text-emerald-400"
      />
      <StatusCard
        icon={<FiXCircle size={18} />}
        title="Total Absent Days"
        value={days(kpis?.absentDays)}
        subtitle={kpis ? trendText(kpis.absentDays) : ""}
        iconColor="text-red-400"
        iconBg="bg-red-950"
        subtitleColor="text-red-400"
      />
      <StatusCard
        icon={<FiClock size={18} />}
        title="Total Late Days"
        value={days(kpis?.lateDays)}
        subtitle={kpis ? trendText(kpis.lateDays) : ""}
        iconColor="text-purple-400"
        iconBg="bg-purple-950"
        subtitleColor="text-purple-400"
      />
      <StatusCard
        icon={<FiCalendar size={18} />}
        title="Total Leave Days"
        value={days(kpis?.leaveDays)}
        subtitle={kpis ? trendText(kpis.leaveDays) : ""}
        iconColor="text-yellow-400"
        iconBg="bg-yellow-950"
        subtitleColor="text-yellow-400"
      />
    </div>
  );
};

export default MonthlyReportCards;
