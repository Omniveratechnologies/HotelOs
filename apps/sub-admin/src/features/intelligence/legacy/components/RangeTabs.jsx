"use client";

const OPTIONS = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
  { key: "12m", label: "12 Months" },
];

export default function RangeTabs({ value, onChange }) {
  return (
    <div className="range-tabs">
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          className={value === o.key ? "active" : ""}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
