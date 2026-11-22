"use client";

export default function ComparisonCard({ rows }) {
  return (
    <table className="comparison-table">
      <thead>
        <tr>
          <th></th>
          <th>Value</th>
          <th>Change</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name}>
            <td style={{ color: "var(--text-muted)" }}>{r.name}</td>
            <td style={{ fontWeight: 700 }}>{r.value}</td>
            <td
              style={{
                color: r.change?.startsWith("-")
                  ? "var(--danger)"
                  : r.change === "baseline" || r.change === "not available"
                    ? "var(--text-muted)"
                    : "var(--success)",
              }}
            >
              {r.change}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
