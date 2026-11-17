import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
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

export interface ComboBar {
  key: string;
  name: string;
  color: string;
}

export interface ComboLine {
  key: string;
  name: string;
  color: string;
  yAxisId?: string;
}

export interface ComboChartProps {
  data: Record<string, unknown>[];
  bar?: ComboBar;
  lines?: ComboLine[];
  height?: number;
}

const DEFAULT_LINES: ComboLine[] = [];

/** bar: {key,name,color}; lines: [{key,name,color,yAxisId}] — used for RevPAR (bars) + ADR/Occupancy (lines). */
export function ComboChart({
  data,
  bar,
  lines = DEFAULT_LINES,
  height = 280,
}: ComboChartProps) {
  const hasSecondAxis = lines.some((l) => l.yAxisId === "right");
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={{ top: 6, right: hasSecondAxis ? 8 : 8, left: -18, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: unknown) => fmt(v)}
          width={44}
        />
        {hasSecondAxis && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
        )}
        <Tooltip
          formatter={(v: unknown, n: unknown) => [fmt(v), String(n ?? "")]}
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #e8e4d9",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {bar && (
          <Bar
            yAxisId="left"
            dataKey={bar.key}
            name={bar.name}
            fill={bar.color}
            radius={[4, 4, 0, 0]}
            barSize={18}
          />
        )}
        {lines.map((l) => (
          <Line
            key={l.key}
            yAxisId={l.yAxisId || "left"}
            type="monotone"
            dataKey={l.key}
            name={l.name}
            stroke={l.color}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default ComboChart;
