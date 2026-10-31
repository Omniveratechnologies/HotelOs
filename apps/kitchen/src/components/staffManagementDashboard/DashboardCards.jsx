import { FiCheck, FiClock, FiUsers, FiX } from "react-icons/fi";
import { FiBriefcase } from "react-icons/fi";

import StatusCard from "../ui/StatusCard.jsx";
import { formatNumber } from "../../utils/dashboardUtils.js";

const percent = (card) =>
  card ? `${Number(card.percent).toFixed(0)}% of total` : "";

const headcountText = (card) => {
  if (!card || card.change === null || card.change === undefined)
    return "Active staff";
  const arrow = card.trend === "UP" ? "↑" : card.trend === "DOWN" ? "↓" : "→";
  return `${arrow} ${Math.abs(card.change)}% from last month`;
};
const DashboardCards = ({ kpis }) => (
  <div className="flex flex-wrap gap-3" aria-label="Today's summary">
    <StatusCard
      icon={<FiUsers size={18} />}
      title="Total Staff"
      value={kpis ? formatNumber(kpis.totalStaff.value) : "-"}
      subtitle={kpis ? headcountText(kpis.totalStaff) : ""}
      iconColor="text-blue-400"
      iconBg="bg-blue-950"
      subtitleColor="text-blue-400"
    />
    <StatusCard
      icon={<FiCheck size={18} />}
      title="Present Today"
      value={kpis ? formatNumber(kpis.present.value) : "-"}
      subtitle={percent(kpis?.present)}
      iconColor="text-emerald-400"
      iconBg="bg-emerald-950"
      subtitleColor="text-emerald-400"
    />
    <StatusCard
      icon={<FiClock size={18} />}
      title="Late Today"
      value={kpis ? formatNumber(kpis.late.value) : "-"}
      subtitle={percent(kpis?.late)}
      iconColor="text-orange-400"
      iconBg="bg-orange-950"
      subtitleColor="text-orange-400"
    />
    <StatusCard
      icon={<FiX size={18} />}
      title="Absent Today"
      value={kpis ? formatNumber(kpis.absent.value) : "-"}
      subtitle={percent(kpis?.absent)}
      iconColor="text-red-400"
      iconBg="bg-red-950"
      subtitleColor="text-red-400"
    />
    <StatusCard
      icon={<FiBriefcase size={18} />}
      title="On Leave"
      value={kpis ? formatNumber(kpis.onLeave.value) : "-"}
      subtitle={percent(kpis?.onLeave)}
      iconColor="text-purple-400"
      iconBg="bg-purple-950"
      subtitleColor="text-purple-400"
    />
  </div>
);

export default DashboardCards;
