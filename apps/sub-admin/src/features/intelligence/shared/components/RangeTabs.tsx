export interface RangeOption {
  key: string;
  label: string;
}

const OPTIONS: RangeOption[] = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
  { key: "12m", label: "12 Months" },
];

export interface RangeTabsProps {
  value: string;
  onChange: (value: string) => void;
}

export function RangeTabs({ value, onChange }: RangeTabsProps) {
  return (
    <div className="range-tabs">
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          className={value === o.key ? "active" : ""}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default RangeTabs;
