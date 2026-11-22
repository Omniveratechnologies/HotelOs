import { useCallback, useEffect, useRef, useState } from "react";

import ImageSlot from "./ImageSlot.jsx";
import { Icon } from "./MarketingIcons.jsx";

/**
 * Row of partner logo cards that scrolls sideways.
 * The arrows and dots work as soon as there are more logos than fit on screen.
 *
 * Props
 *  title, subtitle   optional heading above the logos
 *  logos             [{ name, src }]  (empty src shows a placeholder with the name)
 *  className         extra classes for the outer section (for example a background)
 *  variant           "default" | "compact"  (compact = small title between two lines)
 */
const EMPTY_LOGOS = [];

export default function LogoCarousel({
  title,
  subtitle,
  logos = EMPTY_LOGOS,
  className = "",
  variant = "default",
}) {
  const compact = variant === "compact";
  const trackRef = useRef(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const pages = Math.max(
      1,
      Math.round(track.scrollWidth / track.clientWidth + 0.35),
    );
    setPageCount(pages);
    setPage(
      Math.min(pages - 1, Math.round(track.scrollLeft / track.clientWidth)),
    );
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const goToPage = (target) => {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.min(Math.max(target, 0), pageCount - 1);
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  };

  const canScroll = pageCount > 1;
  const arrowClass =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-900 shadow-md transition-colors hover:bg-background-100 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white";

  return (
    <section className={className}>
      <div
        className={`mx-auto max-w-[1400px] px-6 lg:px-10 ${
          compact ? "py-8" : "py-12"
        }`}
      >
        {(title || subtitle) &&
          (compact ? (
            <div className="flex items-center gap-6">
              <span aria-hidden="true" className="bg-surface-200 h-px flex-1" />
              <h2 className="text-brand-900 text-lg font-semibold">{title}</h2>
              <span aria-hidden="true" className="bg-surface-200 h-px flex-1" />
            </div>
          ) : (
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
          ))}

        <div className={`${compact ? "mt-6" : "mt-8"} flex items-center gap-3`}>
          <button
            type="button"
            aria-label="Previous logos"
            disabled={!canScroll || page === 0}
            onClick={() => goToPage(page - 1)}
            className={arrowClass}
          >
            <Icon name="chevronLeft" className="h-5 w-5" />
          </button>

          <ul
            ref={trackRef}
            onScroll={measure}
            className="flex min-w-0 flex-1 [scrollbar-width:none] gap-4 overflow-x-auto scroll-smooth py-2 [&::-webkit-scrollbar]:hidden"
          >
            {logos.map((logo) => (
              <li
                key={logo.name}
                className="border-surface-200 flex h-20 w-44 shrink-0 items-center justify-center rounded-xl border bg-white px-4 shadow-sm"
              >
                <ImageSlot
                  src={logo.src}
                  label={logo.name}
                  alt={logo.name}
                  fit="contain"
                  className="h-full w-full"
                />
              </li>
            ))}
          </ul>

          <button
            type="button"
            aria-label="Next logos"
            disabled={!canScroll || page >= pageCount - 1}
            onClick={() => goToPage(page + 1)}
            className={arrowClass}
          >
            <Icon name="chevronRight" className="h-5 w-5" />
          </button>
        </div>

        {canScroll && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {Array.from({ length: pageCount }, (_, dotIndex) => (
              <button
                key={`dot-${dotIndex}`}
                type="button"
                aria-label={`Show logos page ${dotIndex + 1}`}
                aria-current={dotIndex === page}
                onClick={() => goToPage(dotIndex)}
                className={`h-1.5 rounded-full transition-all ${
                  dotIndex === page
                    ? "bg-brand-900 w-6"
                    : "bg-surface-300 hover:bg-brand-700/40 w-2"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
