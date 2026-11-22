import { FiAlertTriangle, FiCpu, FiWifiOff } from "react-icons/fi";
import { FaWifi } from "react-icons/fa6";

import StatusCard from "../ui/StatusCard";
import { formatNumber } from "../../utils/attendanceFormat.js";

const DeviceStatusCards = ({ stats }) => {
  const value = (key) => (stats ? formatNumber(stats[key]) : "-");

  return (
    <section
      aria-label="Device summary"
      className="grid grid-cols-2 gap-3 xl:grid-cols-4"
    >
      <StatusCard
        title="Total Devices"
        value={value("total")}
        subtitle={
          stats
            ? `Across ${stats.locations} location${stats.locations === 1 ? "" : "s"}`
            : ""
        }
        icon={<FiCpu size={18} />}
        iconColor="text-blue-400"
        iconBg="bg-blue-500/10"
        subtitleColor="text-blue-400"
      />
      <StatusCard
        title="Online"
        value={value("online")}
        subtitle={stats ? `${stats.percent.online}% of total` : ""}
        icon={<FaWifi size={18} />}
        iconColor="text-emerald-400"
        iconBg="bg-emerald-500/10"
        subtitleColor="text-emerald-400"
      />
      <StatusCard
        title="Offline"
        value={value("offline")}
        subtitle={stats ? `${stats.percent.offline}% of total` : ""}
        icon={<FiWifiOff size={18} />}
        iconColor="text-red-400"
        iconBg="bg-red-500/10"
        subtitleColor="text-red-400"
      />
      <StatusCard
        title="Needs Attention"
        value={value("needsAttention")}
        subtitle={
          stats ? `${stats.offline} offline · ${stats.warning} warning` : ""
        }
        icon={<FiAlertTriangle size={18} />}
        iconColor="text-yellow-400"
        iconBg="bg-yellow-500/10"
        subtitleColor="text-yellow-400"
      />
    </section>
  );
};

export default DeviceStatusCards;
