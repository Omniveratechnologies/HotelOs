import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";

import ImageSlot from "./ImageSlot.jsx";
import { Icon } from "./MarketingIcons.jsx";
import { ROUTES } from "../data/siteContent.js";
import { THEMES } from "../data/themes.js";

const t = THEMES.gold;

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Product details popup (opens from "View Details").
 *
 * Closes with the X button, the Escape key, or a click outside the card.
 * The page behind it does not scroll while it is open, and keyboard focus
 * stays inside the popup and returns to the button that opened it.
 *
 * product = {
 *   category,      small tag, e.g. "POS & BILLING"
 *   title,
 *   summary,       one bold line under the title
 *   description,   paragraph
 *   highlights,    [{ icon, label }]  (icon "brand" shows the HotelOS mark)
 *   features,      ["Key feature", ...]
 *   images,        [url, ...]  gallery (empty strings show placeholders)
 * }
 */
export default function ProductDetailsModal({
  product,
  onClose,
  quoteCta = { label: "Get a Quote", to: ROUTES.requestDemo },
  expertCta = { label: "Talk to Our Expert", to: ROUTES.requestDemo },
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  const images = product.images ?? [];
  const count = Math.max(images.length, 1);
  const move = (step) =>
    setActiveIndex((value) => (value + step + count) % count);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const hadScrollLock = document.body.classList.contains("overflow-hidden");
    document.body.classList.add("overflow-hidden");
    closeRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const items = dialogRef.current?.querySelectorAll(FOCUSABLE);
      if (!items || items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (!hadScrollLock) document.body.classList.remove("overflow-hidden");
      previouslyFocused?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      className="bg-brand-950/50 fixed inset-0 z-50 flex overflow-y-auto p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative m-auto w-full max-w-5xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
      >
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="border-surface-200 text-brand-900 hover:bg-background-100 absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm transition-colors"
        >
          <Icon name="close" className="h-5 w-5" />
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          {/* Gallery */}
          <div className="min-w-0">
            <ImageSlot
              src={images[activeIndex]}
              label={`${product.title} photo`}
              alt={product.title}
              className="aspect-[4/3] w-full rounded-2xl"
            />

            {count > 1 && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() => move(-1)}
                  className="border-surface-200 text-brand-900 hover:bg-background-100 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm transition-colors"
                >
                  <Icon name="chevronLeft" className="h-4 w-4" />
                </button>

                <ul className="grid min-w-0 flex-1 grid-cols-5 gap-3">
                  {Array.from({ length: count }, (_, index) => (
                    <li key={`thumb-${index}`}>
                      <button
                        type="button"
                        aria-label={`Show image ${index + 1}`}
                        aria-current={index === activeIndex}
                        onClick={() => setActiveIndex(index)}
                        className={`block w-full overflow-hidden rounded-lg border-2 transition-colors ${
                          index === activeIndex
                            ? "border-[#e0932b]"
                            : "hover:border-surface-300 border-transparent"
                        }`}
                      >
                        <ImageSlot
                          src={images[index]}
                          label=""
                          alt=""
                          className="aspect-[4/3] w-full"
                        />
                      </button>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => move(1)}
                  className="border-surface-200 text-brand-900 hover:bg-background-100 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm transition-colors"
                >
                  <Icon name="chevronRight" className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0">
            {product.category && (
              <span
                className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase ${t.chip}`}
              >
                {product.category}
              </span>
            )}

            <h2
              id={titleId}
              className="text-brand-900 mt-3 text-3xl leading-tight font-extrabold tracking-tight"
            >
              {product.title}
            </h2>

            {product.summary && (
              <p className="text-brand-900 mt-3 text-lg leading-snug font-medium">
                {product.summary}
              </p>
            )}

            {product.description && (
              <p className="text-brand-700/80 mt-3 text-[15px] leading-relaxed">
                {product.description}
              </p>
            )}

            {product.highlights?.length > 0 && (
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {product.highlights.map((item) => (
                  <li
                    key={item.label}
                    className="flex flex-col items-center gap-2 rounded-xl bg-[#fdf6e8] px-2 py-3 text-center"
                  >
                    {item.icon === "brand" ? (
                      <span className="font-display border-primary-400 bg-brand-900 text-primary-400 flex h-7 w-7 items-center justify-center rounded-full border text-sm leading-none font-bold">
                        H
                      </span>
                    ) : (
                      <Icon
                        name={item.icon}
                        className="h-7 w-7 text-[#e0932b]"
                      />
                    )}
                    <span className="text-brand-800 text-xs leading-tight">
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {product.features?.length > 0 && (
              <>
                <h3 className="border-surface-200 text-brand-900 mt-6 border-t pt-5 text-lg font-bold">
                  Key Features
                </h3>
                <ul className="mt-3 space-y-2">
                  {product.features.map((feature) => (
                    <li
                      key={feature}
                      className="text-brand-800 flex items-start gap-2.5 text-sm"
                    >
                      <Icon
                        name="checkCircle"
                        className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#e0932b]"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={quoteCta.to}
                onClick={onClose}
                className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors ${t.solidButton}`}
              >
                <Icon name="cart" className="h-4 w-4" />
                {quoteCta.label}
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link
                to={expertCta.to}
                onClick={onClose}
                className="border-brand-900 text-brand-900 hover:bg-background-100 inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-colors"
              >
                <Icon name="phone" className="h-4 w-4" />
                {expertCta.label}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
