import { useState } from "react";
import { Link } from "react-router";

import ImageSlot from "./ImageSlot.jsx";
import { Icon } from "./MarketingIcons.jsx";
import { THEMES } from "../data/themes.js";

// Where a floating badge sits on top of the hero image.
const BADGE_POSITIONS = {
  "top-left": "top-4 left-4",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
};

function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="pt-5">
      <ol className="text-brand-700/70 flex flex-wrap items-center gap-1.5 text-xs">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {index > 0 && <Icon name="chevronRight" className="h-3 w-3" />}
            {item.to ? (
              <Link
                to={item.to}
                className="hover:text-brand-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  index === items.length - 1
                    ? "text-brand-900 font-medium"
                    : undefined
                }
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Each line is either a plain string or a list of parts:
 *   ["Run Your", "Restaurant", [{ text: "HotelOS POS", accent: true }]]
 */
function HeroTitle({ lines, accentClass }) {
  return lines.map((line, lineIndex) => {
    const parts = typeof line === "string" ? [{ text: line }] : line;
    return (
      <span key={`line-${lineIndex}`} className="block">
        {parts.map((part, partIndex) => (
          <span
            key={`part-${lineIndex}-${partIndex}`}
            className={part.accent ? accentClass : undefined}
          >
            {part.text}
          </span>
        ))}
      </span>
    );
  });
}

function HeroSlider({ slides, label, showControls, badges, theme }) {
  const [index, setIndex] = useState(0);
  const count = Math.max(slides.length, 1);
  const current = index % count;
  const move = (step) => setIndex((value) => (value + step + count) % count);
  const hasControls = showControls && count > 1;

  return (
    <div className="min-w-0">
      <div className="relative">
        <ImageSlot
          src={slides[current]}
          label={count > 1 ? `${label} ${current + 1}` : label}
          alt={label}
          className="ring-surface-200 aspect-[16/10] w-full rounded-2xl shadow-[0_24px_60px_-20px_rgba(15,31,61,0.35)] ring-1"
        />

        {badges.map((badge) => (
          <div
            key={badge.title}
            className={`absolute flex items-center gap-2.5 rounded-xl bg-white/90 px-3 py-2 shadow-lg backdrop-blur ${
              BADGE_POSITIONS[badge.position] ?? BADGE_POSITIONS["top-left"]
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${theme.tile}`}
            >
              <Icon name={badge.icon} className="h-5 w-5" />
            </span>
            <span>
              <span className="text-brand-900 block text-sm leading-tight font-bold">
                {badge.title}
              </span>
              <span className="text-brand-700/70 block text-[11px]">
                {badge.subtitle}
              </span>
            </span>
          </div>
        ))}

        {hasControls && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => move(-1)}
              className="text-brand-900 hover:bg-background-100 absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-colors"
            >
              <Icon name="chevronLeft" className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => move(1)}
              className="text-brand-900 hover:bg-background-100 absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-colors"
            >
              <Icon name="chevronRight" className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {hasControls && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {slides.map((_, dotIndex) => (
            <button
              key={`dot-${dotIndex}`}
              type="button"
              aria-label={`Show image ${dotIndex + 1}`}
              aria-current={dotIndex === current}
              onClick={() => setIndex(dotIndex)}
              className={`h-1.5 rounded-full transition-all ${
                dotIndex === current
                  ? `w-6 ${theme.dotActive}`
                  : "bg-surface-300 hover:bg-brand-700/40 w-2"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Hero used at the top of every product page (POS, PMS, X Factor, Nexus PMS).
 *
 * Props
 *  theme        "gold" | "rose"
 *  breadcrumb   [{ label, to? }]
 *  eyebrow      { icon?, tag, text? }   small tag + text above the title
 *  title        array of lines (see HeroTitle)
 *  subtitle     optional smaller bold heading under the title
 *  description  paragraph
 *  primaryCta   { label, to }
 *  secondaryCta optional { label, to }: a plain link button shown instead of "Watch Video"
 *  checks       ["Fast & Easy Billing", ...]
 *  slides       image URLs for the right side (empty strings show placeholders)
 *  showControls show arrows + dots when there is more than one slide
 *  badges       floating cards on the image: [{ icon, title, subtitle, position }]
 *               position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
 */
export default function ProductHero({
  theme = "gold",
  breadcrumb = [],
  eyebrow,
  title,
  subtitle,
  description,
  primaryCta,
  secondaryCta,
  secondaryLabel = "Watch Video",
  onSecondaryClick,
  checks = [],
  slides = [],
  slideLabel = "Hero image",
  showControls = true,
  badges = [],
}) {
  const t = THEMES[theme];

  return (
    <section className={t.heroBg}>
      <div className="mx-auto max-w-[1400px] px-6 pb-12 lg:px-10">
        {breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} />}

        <div className="mt-6 grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div>
            {eyebrow && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-bold ${t.chip} ${t.chipBorder}`}
                >
                  {eyebrow.icon && (
                    <Icon name={eyebrow.icon} className="h-3.5 w-3.5" />
                  )}
                  {eyebrow.tag}
                </span>
                {eyebrow.text && (
                  <span className="text-brand-700/80 font-medium">
                    {eyebrow.text}
                  </span>
                )}
              </div>
            )}

            <h1 className="text-brand-900 mt-5 text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl xl:text-[56px]">
              <HeroTitle lines={title} accentClass={t.accentText} />
            </h1>

            {subtitle && (
              <h2 className="text-brand-900 mt-5 max-w-md text-xl leading-snug font-bold sm:text-2xl">
                {subtitle}
              </h2>
            )}

            {description && (
              <p className="text-brand-700/80 mt-5 max-w-md text-base leading-relaxed">
                {description}
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {primaryCta && (
                <Link
                  to={primaryCta.to}
                  className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors ${t.heroButton}`}
                >
                  {primaryCta.label}
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
              )}
              {secondaryCta ? (
                <Link
                  to={secondaryCta.to}
                  className="border-surface-300 text-brand-900 hover:bg-background-100 inline-flex items-center rounded-full border bg-white px-6 py-3 text-sm font-semibold transition-colors"
                >
                  {secondaryCta.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onSecondaryClick}
                  className="border-surface-300 text-brand-900 hover:bg-background-100 inline-flex items-center gap-2.5 rounded-full border bg-white px-5 py-3 text-sm font-semibold transition-colors"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${t.playCircle}`}
                  >
                    <Icon name="play" className="h-3 w-3 fill-current" />
                  </span>
                  {secondaryLabel}
                </button>
              )}
            </div>

            {checks.length > 0 && (
              <ul className="text-brand-700 mt-7 flex flex-wrap gap-x-6 gap-y-3 text-[13px] font-medium">
                {checks.map((text) => (
                  <li key={text} className="flex items-center gap-2">
                    <Icon
                      name="checkCircle"
                      className={`h-5 w-5 shrink-0 ${t.check}`}
                    />
                    {text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <HeroSlider
            slides={slides}
            label={slideLabel}
            showControls={showControls}
            badges={badges}
            theme={t}
          />
        </div>
      </div>
    </section>
  );
}
