import { Link } from "react-router";

import ImageSlot from "./ImageSlot.jsx";
import { Icon } from "./MarketingIcons.jsx";

const TONES = {
  rose: {
    card: "bg-rose-50",
    tile: "bg-rose-100 text-rose-600",
    check: "text-rose-500",
    arrow: "text-rose-500",
    button: "bg-rose-600 hover:bg-rose-700",
  },
  blue: {
    card: "bg-[#eef3fb]",
    tile: "bg-blue-100 text-blue-600",
    check: "text-blue-600",
    arrow: "text-blue-600",
    button: "bg-blue-600 hover:bg-blue-700",
  },
};

/**
 * Large product card (used for Nexus POS and Nexus PMS on the X Factor page).
 *
 * Props
 *  tone         "rose" | "blue"
 *  icon         icon name for the tile
 *  title        card title (an arrow is added after it)
 *  subtitle     short line under the title
 *  description  paragraph
 *  items        checklist strings
 *  cta          { label, to }
 *  image        { src, label }
 */
const EMPTY_ITEMS = [];

export default function SolutionCard({
  tone = "rose",
  icon,
  title,
  subtitle,
  description,
  items = EMPTY_ITEMS,
  cta,
  image,
}) {
  const t = TONES[tone];

  return (
    <article className={`flex flex-col rounded-2xl p-6 sm:p-8 ${t.card}`}>
      <header className="flex items-start gap-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${t.tile}`}
        >
          <Icon name={icon} className="h-7 w-7" />
        </span>
        <div>
          <h3 className="text-brand-900 flex items-center gap-2 text-2xl font-bold">
            {title}
            <Icon name="arrowRight" className={`h-5 w-5 ${t.arrow}`} />
          </h3>
          <p className="text-brand-700/80 mt-1 text-sm">{subtitle}</p>
        </div>
      </header>

      <p className="text-brand-800 mt-5 text-[15px] leading-relaxed">
        {description}
      </p>

      <div className="mt-5 grid flex-1 items-end gap-6 sm:grid-cols-[1fr_0.9fr]">
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li
              key={item}
              className="text-brand-800 flex items-start gap-2.5 text-[14px]"
            >
              <Icon
                name="checkCircle"
                className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${t.check}`}
              />
              {item}
            </li>
          ))}
        </ul>

        <ImageSlot
          src={image?.src}
          label={image?.label ?? title}
          alt={image?.label ?? title}
          className="aspect-[4/3] w-full rounded-xl shadow-lg ring-1 ring-black/5"
        />
      </div>

      {cta && (
        <Link
          to={cta.to}
          className={`mt-6 inline-flex w-fit items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors ${t.button}`}
        >
          {cta.label}
          <Icon name="arrowRight" className="h-4 w-4" />
        </Link>
      )}
    </article>
  );
}
