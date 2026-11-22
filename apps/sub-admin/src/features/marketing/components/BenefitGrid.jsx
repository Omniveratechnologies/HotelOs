import { Icon } from "./MarketingIcons.jsx";
import SectionHeading from "./SectionHeading.jsx";

const ICON_TONES = {
  rose: "bg-rose-50 text-rose-600",
  orange: "bg-orange-50 text-orange-500",
};

/**
 * "Why choose us" grid: cards with an icon tile, a title and a short description.
 *
 * Props
 *  theme            "gold" | "rose"  (colours the heading accent)
 *  title, subtitle  heading (title can be a string or parts, see SectionHeading)
 *  items            [{ icon, title, description, tone? }]  tone: "rose" (default) | "orange"
 */
const EMPTY_ITEMS = [];

export default function BenefitGrid({
  theme = "rose",
  title,
  subtitle,
  items = EMPTY_ITEMS,
}) {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
      <SectionHeading theme={theme} title={title} subtitle={subtitle} />

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li
            key={item.title}
            className="border-surface-200 flex items-start gap-4 rounded-xl border bg-white p-5 shadow-sm"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                ICON_TONES[item.tone ?? "rose"]
              }`}
            >
              <Icon name={item.icon} className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-brand-900 font-semibold">{item.title}</h3>
              <p className="text-brand-700/80 mt-1 text-sm leading-snug">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
