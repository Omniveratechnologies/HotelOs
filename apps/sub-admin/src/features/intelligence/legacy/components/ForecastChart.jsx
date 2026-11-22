"use client";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

const fmt = (v) =>
  Math.abs(v) >= 100000
    ? `${(v / 100000).toFixed(1)}L`
    : Math.abs(v) >= 1000
      ? `${(v / 1000).toFixed(1)}k`
      : v;

/** Actual vs forecast with a shaded confidence band, split by a "Forecast →" divider. `metric` keys off data rows: metric, `${metric}Forecast`, `${metric}Lower`, `${metric}Upper`. */
export default function ForecastChart({
  data,
  metric,
  color = "#157a70",
  height = 240,
  valueFormatter,
}) {
  const yFmt = valueFormatter || fmt;
  const dividerIndex = data.findIndex((d) => d[`${metric}Forecast`] != null);
  const dividerDay = dividerIndex >= 0 ? data[dividerIndex].day : null;
  const rows = data.map((d) => ({
    ...d,
    band:
      d[`${metric}Lower`] != null && d[`${metric}Upper`] != null
        ? [d[`${metric}Lower`], d[`${metric}Upper`]]
        : null,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={rows}
        margin={{ top: 6, right: 8, left: -18, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          minTickGap={28}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={yFmt}
          width={44}
        />
        <Tooltip
          formatter={(v, n) =>
            Array.isArray(v)
              ? [`${yFmt(v[0])} – ${yFmt(v[1])}`, "Range"]
              : [yFmt(v), n]
          }
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #e8e4d9",
            fontSize: 12,
          }}
        />
        {dividerDay && (
          <ReferenceLine
            x={dividerDay}
            stroke="#c8c2b3"
            strokeDasharray="4 4"
            label={{
              value: "Forecast →",
              position: "insideTopLeft",
              fontSize: 10,
              fill: "var(--text-muted)",
            }}
          />
        )}
        <Area
          dataKey="band"
          name="Confidence range"
          stroke="none"
          fill={color}
          fillOpacity={0.14}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey={metric}
          name="Actual"
          stroke={color}
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey={`${metric}Forecast`}
          name="Forecasted"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
