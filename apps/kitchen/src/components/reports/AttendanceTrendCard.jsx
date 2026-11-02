import { useState } from "react";

import {
  MONTHLY_COLOR,
  formatDayMonth,
  formatMonthLabel,
  percentText,
} from "../../utils/monthlyReportUtils.js";

const W = 760;
const H = 215;
const M = { l: 40, r: 42, t: 14, b: 30 };
const INNER_W = W - M.l - M.r;
const INNER_H = H - M.t - M.b;
const LINE = "#38bdf8";

const LEGEND = [
  ["Present", MONTHLY_COLOR.PRESENT],
  ["Absent", MONTHLY_COLOR.ABSENT],
  ["Late", MONTHLY_COLOR.LATE],
];
const AttendanceTrendCard = ({ month, trend }) => {
  const [hover, setHover] = useState(null);
  const days = trend || [];
  const n = Math.max(days.length, 1);

  const tallest = Math.max(
    0,
    ...days.map((d) => d.present + d.late + d.absent),
  );
  const maxLeft = Math.max(4, Math.ceil(tallest / 4) * 4);
  const band = INNER_W / n;
  const barW = Math.min(band * 0.62, 18);
  const x = (i) => M.l + band * (i + 0.5);
  const yLeft = (v) => M.t + INNER_H - (v / maxLeft) * INNER_H;
  const yRight = (p) => M.t + INNER_H - (p / 100) * INNER_H;

  let path = "";
  let pen = false;
  days.forEach((d, i) => {
    if (d.attendancePercent === null || d.attendancePercent === undefined) {
      pen = false;
      return;
    }
    path += `${pen ? "L" : "M"}${x(i).toFixed(1)} ${yRight(d.attendancePercent).toFixed(1)} `;
    pen = true;
  });

  const ticks = [0, 1, 2, 3, 4];
  const empty = trend && tallest === 0;
  const hovered = hover !== null ? days[hover] : null;

  return (
    <section
      aria-label="Attendance trend"
      className="rounded-lg border border-gray-800 p-4"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">
          Attendance Trend - {formatMonthLabel(month)}
        </h2>
        <ul className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400">
          {LEGEND.map(([label, color]) => (
            <li key={label} className="inline-flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {label}
            </li>
          ))}
          <li className="inline-flex items-center gap-1">
            <span
              className="inline-block h-0.5 w-3"
              style={{ backgroundColor: LINE }}
            />
            Attendance %
          </li>
        </ul>
      </div>

      {!trend ? (
        <p className="py-16 text-center text-xs text-gray-500">Loading...</p>
      ) : empty ? (
        <p className="py-16 text-center text-xs text-gray-500">
          No attendance records for this month.
        </p>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label={`Daily attendance for ${formatMonthLabel(month)}`}
            onMouseLeave={() => setHover(null)}
          >
            {ticks.map((t) => {
              const y = M.t + (INNER_H / 4) * t;
              return (
                <g key={t}>
                  <line x1={M.l} x2={W - M.r} y1={y} y2={y} stroke="#1f1f1f" />
                  <text
                    x={M.l - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-gray-500 text-[9px]"
                  >
                    {Math.round(maxLeft - (maxLeft / 4) * t)}
                  </text>
                  <text
                    x={W - M.r + 6}
                    y={y + 3}
                    textAnchor="start"
                    className="fill-gray-500 text-[9px]"
                  >
                    {100 - 25 * t}%
                  </text>
                </g>
              );
            })}
            <text
              transform={`translate(10 ${M.t + INNER_H / 2}) rotate(-90)`}
              textAnchor="middle"
              className="fill-gray-500 text-[9px]"
            >
              Staff Count
            </text>
            <text
              transform={`translate(${W - 8} ${M.t + INNER_H / 2}) rotate(90)`}
              textAnchor="middle"
              className="fill-gray-500 text-[9px]"
            >
              Attendance %
            </text>

            {days.map((d, i) => {
              let top = M.t + INNER_H;
              return (
                <g key={d.date}>
                  {[
                    ["present", MONTHLY_COLOR.PRESENT],
                    ["late", MONTHLY_COLOR.LATE],
                    ["absent", MONTHLY_COLOR.ABSENT],
                  ].map(([key, color]) => {
                    const h = (d[key] / maxLeft) * INNER_H;
                    top -= h;
                    return h > 0 ? (
                      <rect
                        key={key}
                        x={x(i) - barW / 2}
                        y={top}
                        width={barW}
                        height={h}
                        fill={color}
                        opacity={hover === null || hover === i ? 1 : 0.55}
                      />
                    ) : null;
                  })}
                  <text
                    x={x(i)}
                    y={H - 12}
                    textAnchor="middle"
                    className="fill-gray-500 text-[8px]"
                  >
                    {Number(d.date.slice(8))}
                  </text>
                </g>
              );
            })}

            {path && (
              <path
                d={path}
                fill="none"
                stroke={LINE}
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            )}
            {days.map((d, i) =>
              d.attendancePercent === null ||
              d.attendancePercent === undefined ? null : (
                <circle
                  key={d.date}
                  cx={x(i)}
                  cy={yRight(d.attendancePercent)}
                  r="2"
                  fill="#0f0f0f"
                  stroke={LINE}
                  strokeWidth="1.2"
                />
              ),
            )}

            {days.map((d, i) => (
              <rect
                key={`hit-${d.date}`}
                x={M.l + band * i}
                y={M.t}
                width={band}
                height={INNER_H}
                fill="transparent"
                tabIndex={0}
                aria-label={`${formatDayMonth(d.date)}: Present ${d.present}, Late ${d.late}, Absent ${d.absent}, Attendance ${percentText(d.attendancePercent)}`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              />
            ))}
          </svg>

          {hovered && (
            <div
              role="status"
              className="pointer-events-none absolute top-0 z-10 w-36 -translate-x-1/2 rounded-lg border border-gray-700 bg-[#151515] p-2 text-[10px] text-gray-300 shadow-lg"
              style={{
                left: `${Math.min(Math.max((x(hover) / W) * 100, 12), 88)}%`,
              }}
            >
              <p className="mb-1 font-semibold text-white">
                {formatDayMonth(hovered.date)}
              </p>
              <p>Present: {hovered.present}</p>
              <p>Late: {hovered.late}</p>
              <p>Absent: {hovered.absent}</p>
              <p>Attendance: {percentText(hovered.attendancePercent)}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default AttendanceTrendCard;
