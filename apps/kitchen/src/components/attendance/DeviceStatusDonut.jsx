import { STATUS_COLORS } from "../../utils/deviceFormat.js";
import { formatNumber } from "../../utils/attendanceFormat.js";

const RADIUS = 52;
const STROKE = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SERIES = [
  { key: "online", label: "Online", color: STATUS_COLORS.ONLINE },
  { key: "offline", label: "Offline", color: STATUS_COLORS.OFFLINE },
  { key: "warning", label: "Warning", color: STATUS_COLORS.WARNING },
];

const DeviceStatusDonut = ({ stats }) => {
  const total = stats?.total || 0;
  let offset = 0;

  return (
    <section
      aria-label="Device status"
      className="rounded-xl border border-gray-800 bg-[#111111] p-4"
    >
      <h2 className="mb-3 text-sm font-semibold text-white">Device Status</h2>

      <div className="flex items-center gap-4">
        <div className="relative h-36 w-36 shrink-0">
          <svg
            viewBox="0 0 140 140"
            role="img"
            aria-label="Share of online, offline and warning devices"
            className="h-full w-full -rotate-90"
          >
            <circle
              cx="70"
              cy="70"
              r={RADIUS}
              fill="none"
              stroke="#1f1f1f"
              strokeWidth={STROKE}
            />
            {total > 0 &&
              SERIES.map((item) => {
                const length = (stats[item.key] / total) * CIRCUMFERENCE;
                const segment = (
                  <circle
                    key={item.key}
                    cx="70"
                    cy="70"
                    r={RADIUS}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={STROKE}
                    strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += length;
                return length > 0 ? segment : null;
              })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">
              {stats ? formatNumber(total) : "-"}
            </span>
            <span className="text-[10px] text-gray-500">Total Devices</span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2 text-xs">
          {SERIES.map((item) => (
            <li
              key={item.key}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2 text-gray-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
              <span className="text-gray-400">
                {stats
                  ? `${stats[item.key]} (${stats.percent[item.key]}%)`
                  : "-"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default DeviceStatusDonut;
