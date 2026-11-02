import { FiArrowDown, FiArrowUp } from "react-icons/fi";

import { formatClockTime } from "../../utils/dashboardUtils.js";

const Tile = ({ icon, tone, label, entry }) => (
  <div
    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-800 bg-[#111] p-2"
    title={entry?.staff?.name || ""}
  >
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone}`}
    >
      {icon}
    </span>
    <div className="min-w-0">
      <p className="truncate text-[10px] text-gray-400">{label}</p>
      <p className="text-xs font-semibold text-white">
        {entry ? formatClockTime(entry.at) : "-"}
      </p>
    </div>
  </div>
);
const TodayStatusCard = ({ todayStatus }) => {
  const rate = Math.min(Math.max(todayStatus?.presentRate ?? 0, 0), 100);

  return (
    <section
      aria-label="Today's attendance status"
      className="rounded-lg border border-gray-800 p-4"
    >
      <h2 className="mb-2 text-sm font-semibold text-white">
        Today&apos;s Attendance Status
      </h2>

      <div className="relative mx-auto w-full max-w-[220px]">
        <svg
          viewBox="0 0 200 112"
          className="h-auto w-full"
          role="img"
          aria-label={`Present rate ${rate}%`}
        >
          <path
            d="M20 100 A80 80 0 0 1 180 100"
            pathLength="100"
            fill="none"
            stroke="#1f2937"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {rate > 0 && (
            <path
              d="M20 100 A80 80 0 0 1 180 100"
              pathLength="100"
              fill="none"
              stroke="#22c55e"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={`${rate} 100`}
            />
          )}
          <text
            x="100"
            y="84"
            textAnchor="middle"
            className="fill-white text-[28px] font-bold"
          >
            {todayStatus ? `${Math.round(rate)}%` : "-"}
          </text>
          <text
            x="100"
            y="100"
            textAnchor="middle"
            className="fill-gray-400 text-[9px]"
          >
            Present Rate
          </text>
        </svg>
      </div>

      <div className="mt-2 flex gap-2">
        <Tile
          icon={<FiArrowUp size={13} />}
          tone="bg-emerald-950 text-emerald-400"
          label="First Check-In"
          entry={todayStatus?.firstCheckIn}
        />
        <Tile
          icon={<FiArrowDown size={13} />}
          tone="bg-red-950 text-red-400"
          label="Last Check-Out"
          entry={todayStatus?.lastCheckOut}
        />
      </div>
    </section>
  );
};

export default TodayStatusCard;
