import { useEffect, useState } from "react";
import API_BASE_URL from "../../config/api.js";

const COLORS = {
  EXPIRED: "#ef4444",
  SPOILED: "#f97316",
  DAMAGED: "#eab308",
  OVERPRODUCTION: "#3b82f6",
  BURNT: "#a855f7",
  DROPPED: "#22c55e",
  UNKNOWN: "#9ca3af",
};

const PERIOD_OPTIONS = ["Today", "This Week", "This Month", "All Time"];

const buildDonutSegments = (breakdown, radius = 70) => {
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return breakdown.map((item) => {
    const dash = (item.percent / 100) * circumference;
    const segment = {
      ...item,
      dashArray: `${dash} ${circumference - dash}`,
      dashOffset: -offset,
    };
    offset += dash;
    return segment;
  });
};

const WastageReasonsChart = ({ refreshKey }) => {
  const [period, setPeriod] = useState("This Month");
  const [data, setData] = useState({ total: 0, breakdown: [] });

  useEffect(() => {
    fetch(
      `${API_BASE_URL}/inventory/wastage/reasons?period=${encodeURIComponent(period)}`,
    )
      .then((res) => res.json())
      .then((res) => setData(res.data || { total: 0, breakdown: [] }))
      .catch((err) => console.error("Failed to load wastage reasons:", err));
  }, [period, refreshKey]);

  const segments = buildDonutSegments(data.breakdown);
  const radius = 70;
  const thickness = 30;

  return (
    <div className="bg-slate min-h-[280px] rounded-xl border border-gray-800/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Wastage Reasons</h2>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-1.5 text-xs text-gray-300 outline-none"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative shrink-0">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <g transform="translate(90, 90) rotate(-90)">
              {segments.length === 0 ? (
                <circle
                  r={radius}
                  fill="none"
                  stroke="#1f2937"
                  strokeWidth={thickness}
                />
              ) : (
                segments.map((seg) => (
                  <circle
                    key={seg.reason}
                    r={radius}
                    fill="none"
                    stroke={COLORS[seg.reason] || "#9ca3af"}
                    strokeWidth={thickness}
                    strokeDasharray={seg.dashArray}
                    strokeDashoffset={seg.dashOffset}
                  />
                ))
              )}
            </g>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{data.total}</span>
            <span className="text-[10px] text-gray-500">Total</span>
          </div>
        </div>

        <div className="w-full flex-1 space-y-2">
          {data.breakdown.length === 0 ? (
            <p className="text-sm text-gray-500">
              No wastage recorded for this period.
            </p>
          ) : (
            data.breakdown.map((item) => (
              <div
                key={item.reason}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: COLORS[item.reason] || "#9ca3af",
                    }}
                  />
                  <span className="text-gray-300">{item.label}</span>
                </div>
                <span className="font-medium text-gray-400">
                  {item.percent}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WastageReasonsChart;
