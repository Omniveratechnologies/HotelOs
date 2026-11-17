import { money } from "../utils/formatters";

const palette = [
  "#157a70",
  "#d47748",
  "#6b7cae",
  "#b98b38",
  "#478a66",
  "#9b6a8d",
];

export interface BarRow {
  name: string;
  value: number;
  sub?: string;
  color?: string;
}

export interface BarListProps {
  rows: BarRow[];
  formatValue?: (row: BarRow) => string;
}

/**
 * rows: [{ name, value, sub? }] — `value` drives bar width (relative to the max in the list).
 * formatValue(row) controls the trailing label text.
 */
export function BarList({ rows, formatValue }: BarListProps) {
  const max = Math.max(...rows.map((r) => r.value || 0), 1);
  return (
    <div>
      {rows.map((r, i) => (
        <div className="bar-row" key={r.name}>
          <span className="name" title={r.name}>
            {r.name}
          </span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${Math.max(((r.value || 0) / max) * 100, 3)}%`,
                background: r.color || palette[i % palette.length],
              }}
            />
          </div>
          <span className="bar-value">
            {formatValue ? formatValue(r) : money(r.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default BarList;
