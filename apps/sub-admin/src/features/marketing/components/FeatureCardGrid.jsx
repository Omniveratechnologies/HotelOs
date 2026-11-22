import { Icon } from "./MarketingIcons.jsx";
import { THEMES } from "../data/themes.js";

/**
 * "Everything you need" style grid of small cards.
 *
 * Props
 *  theme            "gold" | "rose"
 *  title, subtitle  heading above the cards
 *  items            [{ icon, label }]
 */
const EMPTY_ITEMS = [];

export default function FeatureCardGrid({
  theme = "gold",
  title,
  subtitle,
  items = EMPTY_ITEMS,
}) {
  const t = THEMES[theme];

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
      {(title || subtitle) && (
        <div className="text-center">
          {title && (
            <h2 className="text-brand-900 text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-brand-700/80 mt-2 text-sm">{subtitle}</p>
          )}
        </div>
      )}

      <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li
            key={item.label}
            className="border-surface-200 flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${t.tile}`}
            >
              <Icon name={item.icon} className="h-6 w-6" />
            </span>
            <span className="text-brand-900 text-[15px] font-semibold">
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
