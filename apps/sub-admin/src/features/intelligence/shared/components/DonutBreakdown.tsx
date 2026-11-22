import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { money } from "../utils/formatters";

export interface DonutItem {
  name: string;
  value: number;
  color: string;
}

export interface DonutBreakdownProps {
  data: DonutItem[];
  centerLabel?: string;
  centerValue?: string | number;
  valueIsMoney?: boolean;
}

export function DonutBreakdown({
  data,
  centerLabel,
  centerValue,
  valueIsMoney = true,
}: DonutBreakdownProps) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div
        style={{ width: 150, height: 150, position: "relative", flexShrink: 0 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={46}
              outerRadius={68}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: unknown) =>
                valueIsMoney ? money(v as number) : String(v ?? "")
              }
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #e8e4d9",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {(centerLabel || centerValue) && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15 }}>{centerValue}</div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
              {centerLabel}
            </div>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {data.map((d) => (
          <div className="legend-row" key={d.name}>
            <span className="legend-dot" style={{ background: d.color }} />
            <span className="legend-name">{d.name}</span>
            <span className="legend-value">
              {Math.round(((d.value || 0) / total) * 100)}%
            </span>
            {valueIsMoney && (
              <span
                style={{
                  width: 88,
                  textAlign: "right",
                  color: "var(--text-muted)",
                }}
              >
                {money(d.value)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DonutBreakdown;
