"use client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const fmt = (v) =>
  Math.abs(v) >= 100000
    ? `${(v / 100000).toFixed(1)}L`
    : Math.abs(v) >= 1000
      ? `${(v / 1000).toFixed(1)}k`
      : v;

/** lines: [{ key, name, color }] plotted against `day` on the x-axis. */
export default function TrendChart({
  data,
  lines,
  height = 260,
  area = true,
  yFormatter,
  valueFormatter,
}) {
  const Chart = area ? AreaChart : LineChart;
  const yFmt = yFormatter || fmt;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={yFmt}
          width={44}
        />
        <Tooltip
          formatter={(value, name) => [
            valueFormatter ? valueFormatter(value) : yFmt(value),
            name,
          ]}
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #e8e4d9",
            fontSize: 12,
          }}
        />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {lines.map((line) =>
          area ? (
            <Area
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              fill={line.color}
              fillOpacity={0.12}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ) : (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              strokeDasharray={line.dashed ? "5 4" : undefined}
              connectNulls
            />
          ),
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
