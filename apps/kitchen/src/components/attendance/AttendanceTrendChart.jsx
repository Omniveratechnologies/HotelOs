import { STATUS_SERIES } from "./attendanceColors.js";
import { formatDate } from "../../utils/attendanceFormat.js";

const WIDTH = 360;
const HEIGHT = 190;
const LEFT = 28;
const BOTTOM = 24;
const TOP = 8;

const niceMax = (value) => {
  if (value <= 5) return 5;
  const step = value <= 20 ? 5 : value <= 100 ? 20 : value <= 500 ? 100 : 500;
  return Math.ceil(value / step) * step;
};

const shortLabel = (key) => formatDate(key).slice(0, 6).replace(/^0/, ""); // "7 Oct"

const AttendanceTrendChart = ({
  trend,
  loading = false,
  days = 30,
  onDaysChange,
  error = "",
}) => {
  const points = trend?.points || [];
  const peak = niceMax(
    Math.max(
      0,
      ...points.map((point) =>
        STATUS_SERIES.reduce((sum, item) => sum + point[item.key], 0),
      ),
    ),
  );

  const plotWidth = WIDTH - LEFT;
  const plotHeight = HEIGHT - BOTTOM - TOP;
  const slot = points.length ? plotWidth / points.length : plotWidth;
  const barWidth = Math.max(2, slot * 0.62);
  const labelEvery = Math.max(1, Math.ceil(points.length / 5));

  return (
    <section
      aria-label="Attendance trend"
      className="rounded-xl border border-gray-800 bg-[#111111] p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">Attendance Trend</h2>

        <select
          value={days}
          onChange={(event) => onDaysChange?.(Number(event.target.value))}
          aria-label="Trend period"
          className="rounded-md border border-gray-700 bg-[#0f0f0f] px-2 py-1.5 text-xs text-gray-300 outline-none"
        >
          {[7, 30, 90].map((option) => (
            <option key={option} value={option}>
              Last {option} Days
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p role="alert" className="py-10 text-center text-xs text-red-400">
          {error}
        </p>
      ) : (
        <div
          className={
            loading ? "opacity-60 transition-opacity" : "transition-opacity"
          }
        >
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`Daily attendance for the last ${days} days`}
            className="h-auto w-full"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
              const y = TOP + plotHeight - fraction * plotHeight;
              return (
                <g key={fraction}>
                  <line
                    x1={LEFT}
                    x2={WIDTH}
                    y1={y}
                    y2={y}
                    stroke="#262626"
                    strokeWidth="1"
                  />
                  <text
                    x={LEFT - 6}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="#6b7280"
                  >
                    {Math.round(peak * fraction)}
                  </text>
                </g>
              );
            })}

            {points.map((point, index) => {
              const x = LEFT + index * slot + (slot - barWidth) / 2;
              let used = 0;
              const total = STATUS_SERIES.reduce(
                (sum, item) => sum + point[item.key],
                0,
              );

              return (
                <g key={point.date}>
                  <title>
                    {`${formatDate(point.date)}: ${STATUS_SERIES.map((item) => `${item.label} ${point[item.key]}`).join(", ")}`}
                  </title>

                  {STATUS_SERIES.map((item) => {
                    const height = (point[item.key] / peak) * plotHeight;
                    used += height;
                    return height > 0 ? (
                      <rect
                        key={item.key}
                        x={x}
                        y={TOP + plotHeight - used}
                        width={barWidth}
                        height={height}
                        fill={item.color}
                        data-status={item.key}
                      />
                    ) : null;
                  })}

                  {/* wide invisible target so a thin or empty bar still shows its tooltip */}
                  <rect
                    x={LEFT + index * slot}
                    y={TOP}
                    width={slot}
                    height={plotHeight}
                    fill="transparent"
                    data-total={total}
                  />

                  {index % labelEvery === 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={HEIGHT - 8}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#6b7280"
                    >
                      {shortLabel(point.date)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
            {STATUS_SERIES.map((item) => (
              <li key={item.key} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default AttendanceTrendChart;
