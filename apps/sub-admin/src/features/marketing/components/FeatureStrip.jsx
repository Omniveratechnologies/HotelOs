import { Icon } from "./MarketingIcons.jsx";

// Full class names so Tailwind can find them.
const COLUMN_CLASSES = {
  6: "lg:grid-cols-6",
  7: "lg:grid-cols-7",
  8: "lg:grid-cols-8",
};

/**
 * Row of icon + label items shown under the hero.
 * items: [{ icon: "receipt", label: "Billing & Orders" }, ...]
 */
export default function FeatureStrip({ items, className = "" }) {
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
