import { Icon } from "../ui/MarketingIcons";

const COLUMN_CLASSES: Record<number, string> = {
  6: "lg:grid-cols-6",
  7: "lg:grid-cols-7",
  8: "lg:grid-cols-8",
};

export interface FeatureStripItem {
  icon: string;
  label: string;
}

export interface FeatureStripProps {
  items: FeatureStripItem[];
  className?: string;
}

export default function FeatureStrip({
  items,
  className = "",
}: FeatureStripProps) {
  const columns = COLUMN_CLASSES[items.length] ?? "lg:grid-cols-6";

  return (
    <section className={`mx-auto max-w-[1400px] px-6 lg:px-10 ${className}`}>
      <ul
        className={`border-surface-200 grid grid-cols-2 rounded-2xl border bg-white p-3 shadow-sm sm:grid-cols-4 ${columns}`}
      >
        {items.map((item) => (
          <li
            key={item.label}
            className="hover:bg-background-100 flex flex-col items-center gap-3 rounded-xl px-2 py-5 text-center transition-colors"
          >
            <Icon name={item.icon} className="text-brand-800 h-8 w-8" />
            <span className="text-brand-900 text-[13px] leading-snug font-medium">
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
