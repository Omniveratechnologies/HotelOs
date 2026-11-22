import { useState } from "react";

import {
  OVERVIEW_PARTS,
  dayLabel,
  fieldCls,
} from "../../utils/dashboardUtils.js";

const W = 520;
const H = 215;
const M = { l: 34, r: 8, t: 10, b: 36 };
const INNER_W = W - M.l - M.r;
const INNER_H = H - M.t - M.b;

const niceStep = (raw) => {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  return steps.find((s) => s >= raw) || Math.ceil(raw / 1000) * 1000;
};
const AttendanceOverviewChart = ({ overview, range, onRangeChange }) => {
  const [hover, setHover] = useState(null);
  const days = overview?.days || [];
  const n = Math.max(days.length, 1);
  const tallest = Math.max(
    0,
    ...days.map((d) => d.present + d.late + d.absent + d.onLeave),
  );
  const step = niceStep(Math.max(tallest, 4) / 4);
  const max = step * 4;
  const band = INNER_W / n;
  const barW = Math.min(band * 0.5, 26);
  const x = (i) => M.l + band * (i + 0.5);
  const hovered = hover !== null ? days[hover] : null;
  const weekly = days.length <= 7;

  return (
    <section
      aria-label="Attendance overview"
      className="rounded-lg border border-gray-800 p-4"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">
          Attendance Overview
        </h2>
        <select
          value={range}
          onChange={(e) => onRangeChange(e.target.value)}
          aria-label="Overview range"
          className={`${fieldCls} w-auto py-1.5`}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {!overview ? (
        <p className="py-16 text-center text-xs text-gray-500">Loading...</p>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label={`Daily attendance, ${days.length} days`}
            onMouseLeave={() => setHover(null)}
          >
            {[0, 1, 2, 3, 4].map((t) => {
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
                    {max - step * t}
                  </text>
                </g>
              );
            })}

            {days.map((d, i) => {
              let top = M.t + INNER_H;
              const label = dayLabel(d.date);
              return (
                <g key={d.date}>
                  {OVERVIEW_PARTS.map(([key, , color]) => {
                    const h = (d[key] / max) * INNER_H;
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
                  {weekly ? (
                    <>
                      <text
                        x={x(i)}
                        y={H - 18}
                        textAnchor="middle"
                        className="fill-gray-400 text-[9px]"
                      >
                        {label.weekday}
                      </text>
                      <text
                        x={x(i)}
                        y={H - 7}
                        textAnchor="middle"
                        className="fill-gray-500 text-[8px]"
                      >
                        {label.short}
                      </text>
                    </>
                  ) : (
                    <text
                      x={x(i)}
                      y={H - 12}
                      textAnchor="middle"
                      className="fill-gray-500 text-[8px]"
                    >
                      {label.day}
                    </text>
                  )}
                  <rect
                    x={M.l + band * i}
                    y={M.t}
                    width={band}
                    height={INNER_H}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${label.short}: Present ${d.present}, Late ${d.late}, Absent ${d.absent}, On Leave ${d.onLeave}`}
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                  />
                </g>
              );
            })}
          </svg>

          {hovered && (
            <div
              role="status"
              className="pointer-events-none absolute top-0 z-10 w-32 -translate-x-1/2 rounded-lg border border-gray-700 bg-[#151515] p-2 text-[10px] text-gray-300 shadow-lg"
              style={{
                left: `${Math.min(Math.max((x(hover) / W) * 100, 14), 86)}%`,
              }}
            >
              <p className="mb-1 font-semibold text-white">
                {dayLabel(hovered.date).short}
              </p>
              {OVERVIEW_PARTS.map(([key, label]) => (
                <p key={key}>
                  {label}: {hovered[key]}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <ul className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[10px] text-gray-400">
        {OVERVIEW_PARTS.map(([key, label, color]) => (
          <li key={key} className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default AttendanceOverviewChart;
