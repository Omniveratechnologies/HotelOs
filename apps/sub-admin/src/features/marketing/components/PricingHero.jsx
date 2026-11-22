import ImageSlot from "./ImageSlot.jsx";
import { Icon } from "./MarketingIcons.jsx";
import { THEMES } from "../data/themes.js";

const t = THEMES.gold;

/**
 * Pricing page hero: tag, three-line title, text, three small badges, and a
 * photo that fills the right side (below the text on phones).
 *
 * Props
 *  tag          small pill above the title
 *  title        [{ text, accent? }]  one entry per line
 *  description  paragraph
 *  badges       [{ icon, label }]  (label may contain \n for a line break)
 *  image        { src, label }
 */
const EMPTY_TITLE = [];
const EMPTY_BADGES = [];

export default function PricingHero({
  tag,
  title = EMPTY_TITLE,
  description,
  badges = EMPTY_BADGES,
  image,
}) {
  const imageLabel = image?.label ?? "Hero image";

  return (
    <section className="relative isolate overflow-hidden bg-[#faf6ee]">
      <ImageSlot
        src={image?.src}
        label={imageLabel}
        alt={imageLabel}
        className="absolute inset-y-0 right-0 -z-20 hidden w-[62%] lg:block"
      />
      <div className="absolute inset-y-0 left-0 -z-10 hidden w-[70%] bg-linear-to-r from-[#faf6ee] via-[#faf6ee]/90 to-transparent lg:block" />

      <div className="mx-auto max-w-[1400px] px-6 py-14 lg:px-10 lg:py-20">
        <div className="max-w-xl">
          {tag && (
            <span
              className={`inline-block rounded-full border px-4 py-1.5 text-xs font-bold tracking-wider uppercase ${t.chip} ${t.chipBorder}`}
            >
              {tag}
            </span>
          )}

          <h1 className="text-brand-900 mt-5 text-5xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
            {title.map((line) => (
              <span
                key={line.text}
                className={`block ${line.accent ? t.accentText : ""}`}
              >
                {line.text}
              </span>
            ))}
          </h1>

          {description && (
            <p className="text-brand-700/80 mt-6 max-w-md text-lg leading-relaxed">
              {description}
            </p>
          )}

          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
            {badges.map((badge) => (
              <li key={badge.label} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fdf1dd] text-[#e0932b]">
                  <Icon name={badge.icon} className="h-5 w-5" />
                </span>
                <span className="text-brand-800 text-sm leading-snug font-medium whitespace-pre-line">
                  {badge.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <ImageSlot
          src={image?.src}
          label={imageLabel}
          alt={imageLabel}
          className="mt-10 aspect-[16/10] w-full rounded-2xl lg:hidden"
        />
      </div>
    </section>
  );
}
