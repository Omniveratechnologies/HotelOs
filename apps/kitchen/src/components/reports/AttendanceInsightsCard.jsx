import { FiClock, FiLogOut, FiTrendingUp, FiBarChart2 } from "react-icons/fi";

const Tile = ({ icon, bg, color, value, label, valueClass = "text-white" }) => (
  <div className="flex min-w-[150px] flex-1 items-center gap-3 rounded-lg border border-gray-800 bg-[#111111] p-3">
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg} ${color}`}
    >
      {icon}
    </span>
    <div>
      <p className={`text-base font-bold ${valueClass}`}>{value}</p>
      <p className="text-[11px] text-gray-400">{label}</p>
    </div>
  </div>
);

const AttendanceInsightsCard = ({ insights }) => {
  const change = insights?.vsPreviousDay?.changePercent;
  const changeText =
    change === null || change === undefined
      ? "-"
      : `${change > 0 ? "+" : ""}${change}%`;
  const changeColor =
    change === null || change === undefined
      ? "text-white"
      : change >= 0
        ? "text-emerald-400"
        : "text-red-400";

  return (
    <section
      aria-label="Attendance insights"
      className="rounded-lg border border-gray-800 p-4"
    >
      <h2 className="mb-3 text-sm font-semibold text-white">
        Attendance Insights
      </h2>
      <div className="flex flex-wrap gap-3">
        <Tile
          icon={<FiClock size={18} />}
          bg="bg-blue-950"
          color="text-blue-400"
          value={insights ? insights.averageCheckIn.label || "-" : "-"}
          label="Average Check In"
        />
        <Tile
          icon={<FiLogOut size={18} />}
          bg="bg-red-950"
          color="text-red-400"
          value={insights ? insights.averageCheckOut.label || "-" : "-"}
          label="Average Check Out"
        />
        <Tile
          icon={<FiBarChart2 size={18} />}
          bg="bg-emerald-950"
          color="text-emerald-400"
          value={insights ? insights.averageWorkHours.label || "-" : "-"}
          label="Average Work Hours"
        />
        <Tile
          icon={<FiTrendingUp size={18} />}
          bg="bg-purple-950"
          color="text-purple-400"
          value={insights ? changeText : "-"}
          valueClass={changeColor}
          label="vs. Previous Day"
        />
      </div>
    </section>
  );
};

export default AttendanceInsightsCard;
