import {
  FiClock,
  FiLogOut,
  FiUserCheck,
  FiUserX,
  FiUsers,
} from "react-icons/fi";

import StatusCard from "../ui/StatusCard.jsx";
import { percentText } from "../../utils/dailyreportUtils.js";

const DailyReportCards = ({ kpis }) => {
  const pct = kpis?.percentages;
  const sub = (key) => (pct ? `${percentText(pct[key])} of total` : "");

  return (
    <div className="flex flex-wrap gap-3" aria-label="Attendance summary">
      <StatusCard
        icon={<FiUsers size={18} />}
        title="Total Staff"
        value={kpis?.totalStaff ?? "-"}
        subtitle="Active staff"
        iconColor="text-blue-400"
        iconBg="bg-blue-950"
        subtitleColor="text-blue-400"
      />
      <StatusCard
        icon={<FiUserCheck size={18} />}
        title="Present"
        value={kpis?.present ?? "-"}
        subtitle={sub("present")}
        iconColor="text-emerald-400"
        iconBg="bg-emerald-950"
        subtitleColor="text-emerald-400"
      />
      <StatusCard
        icon={<FiUserX size={18} />}
        title="Absent"
        value={kpis?.absent ?? "-"}
        subtitle={sub("absent")}
        iconColor="text-red-400"
        iconBg="bg-red-950"
        subtitleColor="text-red-400"
      />
      <StatusCard
        icon={<FiClock size={18} />}
        title="Late"
        value={kpis?.late ?? "-"}
        subtitle={sub("late")}
        iconColor="text-purple-400"
        iconBg="bg-purple-950"
        subtitleColor="text-purple-400"
      />
      <StatusCard
        icon={<FiLogOut size={18} />}
        title="Early Leave"
        value={kpis?.earlyLeave ?? "-"}
        subtitle={sub("earlyLeave")}
        iconColor="text-yellow-400"
        iconBg="bg-yellow-950"
        subtitleColor="text-yellow-400"
      />
    </div>
  );
};

export default DailyReportCards;
