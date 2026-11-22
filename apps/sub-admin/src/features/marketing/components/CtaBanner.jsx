import { Link } from "react-router";

import ImageSlot from "./ImageSlot.jsx";
import { Icon } from "./MarketingIcons.jsx";
import { RichTitle } from "./SectionHeading.jsx";
import { THEMES } from "../data/themes.js";

// Icon colour on the dark background.
const PERK_TONE = {
  gold: "text-[#e6b84d]",
  rose: "text-rose-300",
};

// Accent colour for part of the title on the dark background.
const TITLE_ACCENT = {
  gold: "text-[#e6b84d]",
  rose: "text-rose-500",
};

/**
 * Dark banner near the bottom of a product page.
 *
 * Props
 *  theme            "gold" | "rose"
 *  eyebrow          small uppercase line above the title
 *  title            heading: a string, or parts like [{ text: "Grow with " }, { text: "X Factor", accent: true }]
 *  description      paragraph
 *  primaryCta       { label, to }
 *  secondaryCta     { label, to }
 *  perks            [{ icon, label }]  small icon list on the right (label may contain \n)
 *  stats            [{ value, label }]  big numbers shown on the right
 *  checks           ["Free Consultation", ...]  short checklist with a headset badge on the right
 *  showBackground   false = plain dark banner without the background photo
 *  sideImage        { src, label }     optional image on the right instead of perks
 *  backgroundSrc    banner background image URL (empty shows a dark placeholder)
 */
const EMPTY_PERKS = [];
const EMPTY_STATS = [];
const EMPTY_CHECKS = [];

export default function CtaBanner({
  theme = "gold",
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  perks = EMPTY_PERKS,
  stats = EMPTY_STATS,
  checks = EMPTY_CHECKS,
  showBackground = true,
  sideImage,
  backgroundSrc,
  backgroundLabel = "Banner background",
}) {
  const t = THEMES[theme];

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
      <div className="bg-brand-950 relative isolate overflow-hidden rounded-3xl px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-12">
        {showBackground && (
          <>
            <ImageSlot
              src={backgroundSrc}
              label={backgroundLabel}
              tone="dark"
              className="absolute inset-0 -z-10"
            />
            <div className="from-brand-950 via-brand-950/80 to-brand-950/30 absolute inset-0 -z-10 bg-linear-to-r" />
          </>
        )}

        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            {eyebrow && (
              <p
                className={`mb-3 text-xs font-bold tracking-[0.18em] uppercase ${TITLE_ACCENT[theme]}`}
              >
                {eyebrow}
              </p>
            )}
            <h2 className="max-w-lg text-2xl leading-tight font-bold sm:text-3xl">
              <RichTitle title={title} accentClass={TITLE_ACCENT[theme]} />
            </h2>

            {description && (
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">
                {description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {primaryCta && (
                <Link
                  to={primaryCta.to}
                  className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors ${t.solidButton}`}
                >
                  {primaryCta.label}
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
              )}
              {secondaryCta && (
                <Link
                  to={secondaryCta.to}
                  className="inline-flex items-center rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          </div>

          {perks.length > 0 && (
            <ul className="grid gap-3 lg:justify-self-end">
              {perks.map((perk) => (
                <li
                  key={perk.label}
                  className="flex items-center gap-3 text-sm font-medium"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 ${PERK_TONE[theme]}`}
                  >
                    <Icon name={perk.icon} className="h-5 w-5" />
                  </span>
                  <span className="whitespace-pre-line">{perk.label}</span>
                </li>
              ))}
            </ul>
          )}

          {checks.length > 0 && (
            <div className="flex items-center gap-5 lg:justify-self-end">
              <span
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 ${PERK_TONE[theme]}`}
              >
                <Icon name="headset" className="h-8 w-8" />
              </span>
              <ul className="space-y-1.5 text-sm">
                {checks.map((check) => (
                  <li key={check} className="flex items-center gap-2">
                    <Icon
                      name="checkCircle"
                      className={`h-4 w-4 shrink-0 ${PERK_TONE[theme]}`}
                    />
                    {check}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stats.length > 0 && (
            <ul className="grid grid-cols-3 gap-4 rounded-2xl bg-white/10 p-6 text-center backdrop-blur lg:justify-self-end">
              {stats.map((stat) => (
                <li key={stat.label}>
                  <span className="block text-2xl font-extrabold sm:text-3xl">
                    {stat.value}
                  </span>
                  <span className="mt-1 block text-xs text-white/80">
                    {stat.label}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {sideImage && (
            <ImageSlot
              src={sideImage.src}
              label={sideImage.label}
              alt={sideImage.label}
              tone="dark"
              className="aspect-[16/10] w-full rounded-2xl"
            />
          )}
        </div>
      </div>
    </section>
  );
}
