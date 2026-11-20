import { Link } from "react-router";

import ImageSlot from "../../marketing/components/ImageSlot.jsx";
import { Icon } from "../../marketing/components/MarketingIcons.jsx";
import { ROUTES } from "../../marketing/data/siteContent.js";
import { THEMES } from "../../marketing/data/themes.js";

const t = THEMES.gold;

const CHECKS = [
  "Easy to Use",
  "Trusted by Hotels & Restaurants",
  "Scalable for Any Size",
];

/**
 * Landing page hero.
 * images: { background, mockup }  (empty strings show placeholders)
 */
export default function Hero({ images }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#faf6ee]">
      {/* Hotel photo on the right, faded into the cream background on the left */}
      <ImageSlot
        src={images.background}
        label="Hero background photo"
        className="absolute inset-y-0 right-0 -z-20 hidden w-[68%] lg:block"
      />
      <div className="absolute inset-y-0 left-0 -z-10 hidden w-[78%] bg-linear-to-r from-[#faf6ee] via-[#faf6ee]/90 to-transparent lg:block" />

      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-6 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2.5 rounded-full border border-[#f0dcb3] bg-[#fbf3e4] px-4 py-2 text-sm font-medium text-[#b8822a]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#d4a02f]" />
            Hotel + Restaurant Operations, Simplified
          </span>

          <h1 className="text-brand-900 mt-6 text-5xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl xl:text-7xl">
            <span className="block">One Platform</span>
            <span className="block">
              for <span className={t.accentText}>Hotels</span>
            </span>
            <span className="block">
              &amp; <span className={t.accentText}>Restaurants.</span>
            </span>
          </h1>

          <p className="text-brand-700/80 mt-6 max-w-md text-lg leading-relaxed">
            Manage rooms, reservations, restaurant POS, staff, and guests — all
            in one intelligent system.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to={ROUTES.requestDemo}
              className="bg-brand-900 hover:bg-brand-800 inline-flex items-center gap-2 rounded-xl px-7 py-4 text-base font-semibold text-white transition-colors"
            >
              Request a Demo
              <Icon name="arrowRight" className="h-5 w-5" />
            </Link>
            <button
              type="button"
              className="border-surface-300 text-brand-900 inline-flex items-center gap-3 rounded-xl border bg-white/80 px-6 py-4 text-base font-semibold transition-colors hover:bg-white"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${t.playCircle}`}
              >
                <Icon name="play" className="h-3.5 w-3.5 fill-current" />
              </span>
              Watch Video
            </button>
          </div>

          <ul className="text-brand-700 mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {CHECKS.map((text) => (
              <li key={text} className="flex items-center gap-2">
                <Icon
                  name="checkCircle"
                  className={`h-5 w-5 shrink-0 ${t.check}`}
                />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <ImageSlot
          src={images.mockup}
          label="Dashboard and POS devices"
          alt="HotelOS dashboard and POS on laptop and tablet"
          fit="contain"
          className="aspect-[16/10] w-full"
        />
      </div>
    </section>
  );
}
