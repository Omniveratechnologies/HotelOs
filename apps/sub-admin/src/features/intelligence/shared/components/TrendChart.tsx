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

const fmt = (v: number | string | unknown) => {
  const numVal = Number(v);
  if (!Number.isFinite(numVal)) return String(v ?? "");
  return Math.abs(numVal) >= 100000
    ? `${(numVal / 100000).toFixed(1)}L`
    : Math.abs(numVal) >= 1000
      ? `${(numVal / 1000).toFixed(1)}k`
      : String(numVal);
};

export interface TrendLine {
  key: string;
  name: string;
  color: string;
  dashed?: boolean;
}

export interface TrendChartProps {
  data: Record<string, unknown>[];
  lines: TrendLine[];
  height?: number;
  area?: boolean;
  yFormatter?: (v: number | string) => string;
  valueFormatter?: (v: number | string) => string;
}

/** lines: [{ key, name, color }] plotted against `day` on the x-axis. */
export function TrendChart({
  data,
  lines,
  height = 260,
  area = true,
  yFormatter,
  valueFormatter,
}: TrendChartProps) {
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
          tickFormatter={(v: unknown) => yFmt(v as number | string)}
          width={44}
        />
        <Tooltip
          formatter={(value: unknown, name: unknown) => [
            valueFormatter
              ? valueFormatter(value as number | string)
              : yFmt(value as number | string),
            String(name ?? ""),
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

export default TrendChart;
