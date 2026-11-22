import ImageSlot from "./ImageSlot.jsx";
import { Icon } from "./MarketingIcons.jsx";

const TILE_TONES = {
  rose: "bg-rose-100 text-rose-600",
  blue: "bg-blue-100 text-blue-600",
  white: "bg-white text-brand-900",
};

/**
 * Dark band with a row of items joined by "+" signs.
 *
 * Props
 *  title, description   heading text
 *  items                 [{ icon, label, tone? }]  tone: "rose" | "blue" | "white" (default)
 *  backgroundSrc         background image URL (empty shows a dark placeholder)
 */
export default function EcosystemBand({
  title,
  description,
  items = [],
  backgroundSrc,
  backgroundLabel = "Band background",
}) {
  return (
    <section className="bg-brand-950 relative isolate overflow-hidden text-white">
      <ImageSlot
        src={backgroundSrc}
        label={backgroundLabel}
        tone="dark"
        className="absolute inset-0 -z-10"
      />
      <div className="bg-brand-950/70 absolute inset-0 -z-10" />

      <div className="mx-auto max-w-[1400px] px-6 py-14 text-center lg:px-10">
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        {description && (
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/80">
            {description}
          </p>
        )}

        <ul className="mt-10 flex flex-wrap items-start justify-center gap-y-8">
          {items.map((item, index) => (
            <li key={item.label} className="flex items-center">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="px-3 text-2xl font-light text-white/70 sm:px-8"
                >
                  +
                </span>
              )}
              <div className="flex w-28 flex-col items-center gap-3">
                <span
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                    TILE_TONES[item.tone ?? "white"]
                  }`}
                >
                  <Icon name={item.icon} className="h-8 w-8" />
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
