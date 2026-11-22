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

const fmt = (v: number | string | unknown) => {
  const numVal = Number(v);
  if (!Number.isFinite(numVal)) return String(v ?? "");
  return Math.abs(numVal) >= 100000
    ? `${(numVal / 100000).toFixed(1)}L`
    : Math.abs(numVal) >= 1000
      ? `${(numVal / 1000).toFixed(1)}k`
      : String(numVal);
};

export interface ForecastChartProps {
  data: Record<string, unknown>[];
  metric: string;
  color?: string;
  height?: number;
  valueFormatter?: (v: number | string) => string;
}

/** Actual vs forecast with a shaded confidence band, split by a "Forecast →" divider. `metric` keys off data rows: metric, `${metric}Forecast`, `${metric}Lower`, `${metric}Upper`. */
export function ForecastChart({
  data,
  metric,
  color = "#157a70",
  height = 240,
  valueFormatter,
}: ForecastChartProps) {
  const yFmt = valueFormatter || fmt;
  const dividerIndex = data.findIndex((d) => d[`${metric}Forecast`] != null);
  const dividerDay =
    dividerIndex >= 0 ? (data[dividerIndex].day as string) : null;
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
          tickFormatter={(v: unknown) => yFmt(v as number | string)}
          width={44}
        />
        <Tooltip
          formatter={(v: unknown, n: unknown) =>
            Array.isArray(v)
              ? [
                  `${yFmt(v[0] as number | string)} – ${yFmt(v[1] as number | string)}`,
                  "Range",
                ]
              : [yFmt(v as number | string), String(n ?? "")]
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

export default ForecastChart;
