import { Link } from "react-router";

import ImageSlot from "./ImageSlot.jsx";
import { Icon } from "./MarketingIcons.jsx";
import { SITE_IMAGES, SOLUTIONS_MENU } from "../data/siteContent.js";

/* PMS and POS columns share the same layout. */
function SolutionColumn({ data, onNavigate, withDivider = false }) {
  return (
    <div
      className={`flex flex-col px-5 py-2 ${
        withDivider ? "border-surface-200 border-r" : ""
      }`}
    >
      <Link
        to={data.to}
        onClick={onNavigate}
        className="group flex items-start gap-3.5"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#fdf1dd] text-[#e0932b]">
          <Icon name={data.icon} className="h-7 w-7" />
        </span>
        <span className="min-w-0">
          <span className="text-brand-900 flex items-center gap-2 text-xl font-bold">
            {data.title}
            <Icon
              name="arrowRight"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            />
          </span>
          <span className="text-brand-700/70 mt-1 block text-[13px] leading-snug">
            {data.description}
          </span>
        </span>
      </Link>

      <ul className="mt-6 flex-1 space-y-1">
        {data.items.map((item) => (
          <li key={item.label}>
            <Link
              to={data.to}
              onClick={onNavigate}
              className="text-brand-900 hover:bg-background-100 flex items-center gap-3 rounded-lg px-2 py-2 text-[15px] transition-colors"
            >
              <Icon
                name={item.icon}
                className="text-brand-700 h-5 w-5 shrink-0"
              />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        to={data.to}
        onClick={onNavigate}
        className="text-brand-900 hover:bg-primary-100 mt-5 flex items-center justify-center gap-2 rounded-lg bg-[#fbf3e4] px-4 py-3 text-sm font-semibold transition-colors"
      >
        {data.cta}
        <Icon name="arrowRight" className="h-4 w-4" />
      </Link>
    </div>
  );
}

/* X Factor column: heading + two pink product cards. */
function XFactorColumn({ data, images, onNavigate }) {
  return (
    <div className="flex flex-col px-5 py-2">
      <Link
        to={data.to}
        onClick={onNavigate}
        className="group flex items-start gap-3.5"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <Icon name="xMark" strokeWidth={3} className="h-7 w-7" />
        </span>
        <span className="min-w-0">
          <span className="text-brand-900 flex items-center gap-2 text-xl font-bold">
            {data.title}
            <Icon
              name="arrowRight"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            />
          </span>
          <span className="text-brand-700/70 mt-1 block text-[13px] leading-snug">
            {data.description}
          </span>
        </span>
      </Link>

      <div className="mt-4 space-y-3">
        {data.cards.map((card) => (
          <div
            key={card.title}
            className="flex items-stretch gap-3 rounded-xl bg-linear-to-r from-rose-50 to-rose-50/40 p-4"
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/80 text-rose-500">
                  <Icon name={card.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <Link
                    to={card.to}
                    onClick={onNavigate}
                    className="group text-brand-900 flex items-center gap-1.5 font-bold"
                  >
                    {card.title}
                    <Icon
                      name="arrowRight"
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                  <p className="text-brand-700/70 mt-1 text-xs leading-snug">
                    {card.description}
                  </p>
                </div>
              </div>

              <Link
                to={card.to}
                onClick={onNavigate}
                className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-md bg-rose-100 px-4 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-200"
              >
                Explore More
                <Icon name="arrowRight" className="h-3.5 w-3.5" />
              </Link>
            </div>

            <ImageSlot
              src={images[card.imageKey]}
              label={card.imageLabel}
              alt={card.imageLabel}
              className="hidden aspect-[4/3] w-36 shrink-0 self-center rounded-lg xl:block"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* Dark promo card on the right. */
function PromoCard({ data, images, onNavigate }) {
  return (
    <div className="bg-brand-950 relative isolate flex flex-col overflow-hidden rounded-2xl p-6 text-white">
      <ImageSlot
        src={images.menuPromoBackground}
        label="Promo background"
        tone="dark"
        className="absolute inset-0 -z-10"
      />
      <div className="bg-brand-950/55 absolute inset-0 -z-10" />

      <span className="flex items-center gap-1.5 text-sm font-semibold tracking-wide">
        <Icon name="xMark" strokeWidth={3} className="h-4 w-4 text-rose-500" />
        {data.eyebrow}
      </span>

      <p className="mt-4 text-3xl leading-[1.08] font-extrabold">
        {data.lineTop}
        <br />
        <span className="text-5xl text-rose-500">{data.lineAccent}</span>
        <br />
        {data.lineBottom}
      </p>

      <p className="mt-4 max-w-[17rem] text-[13px] leading-snug text-white/90">
        {data.description}
      </p>

      <Link
        to={data.to}
        onClick={onNavigate}
        className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/70 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10"
      >
        {data.cta}
        <Icon name="arrowRight" className="h-4 w-4" />
      </Link>

      <ImageSlot
        src={images.menuPromoDevices}
        label="Nexus devices"
        alt="Nexus POS and PMS devices"
        tone="dark"
        className="mt-6 aspect-[16/9] w-full self-end rounded-xl"
      />
    </div>
  );
}

export default function SolutionsMenu({ images = SITE_IMAGES, onNavigate }) {
  const { pms, pos, xFactor, promo } = SOLUTIONS_MENU;

  return (
    <div
      aria-label="Solutions menu"
      className="border-surface-200 grid max-h-[calc(100vh-6rem)] gap-2 overflow-y-auto rounded-2xl border bg-white p-4 shadow-[0_28px_70px_-18px_rgba(15,31,61,0.35)] lg:grid-cols-[1.1fr_1fr_1.7fr_1.35fr]"
    >
      <SolutionColumn data={pms} onNavigate={onNavigate} withDivider />
      <SolutionColumn data={pos} onNavigate={onNavigate} withDivider />
      <XFactorColumn data={xFactor} images={images} onNavigate={onNavigate} />
      <PromoCard data={promo} images={images} onNavigate={onNavigate} />
    </div>
  );
}
