import ImageSlot from "./ImageSlot.jsx";
import { Icon } from "./MarketingIcons.jsx";

/**
 * Cream band: text and checklist on the left, one big photo and four small
 * captioned photos on the right.
 *
 * Props
 *  label, title, description   text block
 *  points                       checklist strings
 *  mainImage                    { src, label }
 *  thumbnails                   [{ src, title, caption }]
 */
export default function SoftwareOnHardware({
  label,
  title,
  description,
  points = [],
  mainImage,
  thumbnails = [],
}) {
  return (
    <section className="bg-[#fbf3e4]">
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-6 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14 lg:px-10">
        <div>
          {label && (
            <p className="text-xs font-bold tracking-[0.18em] text-[#c9962c] uppercase">
              {label}
            </p>
          )}
          <h2 className="text-brand-900 mt-3 text-4xl leading-tight font-extrabold tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-brand-700/80 mt-4 max-w-md text-base leading-relaxed">
              {description}
            </p>
          )}

          <ul className="mt-6 space-y-3">
            {points.map((point) => (
              <li
                key={point}
                className="text-brand-800 flex items-center gap-3 text-[15px]"
              >
                <Icon
                  name="checkCircle"
                  className="h-5 w-5 shrink-0 text-[#e0932b]"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ImageSlot
            src={mainImage?.src}
            label={mainImage?.label ?? "Main photo"}
            alt={mainImage?.label ?? title}
            className="aspect-[16/10] w-full rounded-2xl shadow-lg"
          />

          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {thumbnails.map((thumb) => (
              <li key={thumb.title}>
                <ImageSlot
                  src={thumb.src}
                  label={thumb.title}
                  alt={thumb.title}
                  className="aspect-[4/3] w-full rounded-lg"
                />
                <p className="text-brand-900 mt-2 text-[13px] leading-tight font-semibold">
                  {thumb.title}
                </p>
                <p className="text-brand-700/70 text-xs">{thumb.caption}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
