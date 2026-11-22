import ImageSlot from "./ImageSlot.jsx";
import { Icon } from "./MarketingIcons.jsx";
import { THEMES } from "../data/themes.js";

/**
 * One feature block: small label, heading, description, checklist and an
 * image on the left or right.
 *
 * Props
 *  id           optional, lets a link jump to this section (#id)
 *  theme        "gold" | "rose"
 *  label        small tag above the heading
 *  title        heading
 *  description  paragraph
 *  items        checklist strings
 *  image        { src, label }
 *  imageSide    "left" | "right"
 */
const EMPTY_ITEMS = [];

export default function FeatureSection({
  id,
  theme = "gold",
  label,
  title,
  description,
  items = EMPTY_ITEMS,
  image,
  imageSide = "right",
}) {
  const t = THEMES[theme];
  const imageRight = imageSide === "right";

  return (
    <section
      id={id}
      className="mx-auto max-w-[1400px] scroll-mt-24 px-6 py-8 lg:px-10 lg:py-10"
    >
      <div
        className={`grid items-center gap-8 lg:gap-14 ${
          imageRight
            ? "lg:grid-cols-[0.85fr_1.15fr]"
            : "lg:grid-cols-[1.15fr_0.85fr]"
        }`}
      >
        <div className={imageRight ? "lg:order-1" : "lg:order-2"}>
          {label && (
            <span
              className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase ${t.chip}`}
            >
              {label}
            </span>
          )}

          <h2 className="text-brand-900 mt-4 text-3xl font-bold tracking-tight">
            {title}
          </h2>

          {description && (
            <p className="text-brand-700/80 mt-3 max-w-md text-base leading-relaxed">
              {description}
            </p>
          )}

          <ul className="mt-6 space-y-3">
            {items.map((item) => (
              <li
                key={item}
                className="text-brand-800 flex items-start gap-3 text-[15px]"
              >
                <Icon
                  name="checkCircle"
                  className={`mt-0.5 h-5 w-5 shrink-0 ${t.check}`}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className={imageRight ? "lg:order-2" : "lg:order-1"}>
          <ImageSlot
            src={image?.src}
            label={image?.label ?? title}
            alt={image?.label ?? title}
            className="ring-surface-200 aspect-[16/10] w-full rounded-2xl shadow-[0_20px_50px_-20px_rgba(15,31,61,0.3)] ring-1"
          />
        </div>
      </div>
    </section>
  );
}
