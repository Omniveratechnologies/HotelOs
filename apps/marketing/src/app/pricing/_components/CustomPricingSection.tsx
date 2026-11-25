import Link from "next/link";
import ImageSlot from "@/components/ui/ImageSlot";
import { Icon } from "@/components/ui/MarketingIcons";

export interface CustomPricingCard {
  icon: string;
  title: string;
  tag?: string;
  description: string;
  image?: { src?: string; label?: string };
  cta?: { label: string; to: string };
}

export interface CustomPricingSectionProps {
  chip?: string;
  title: string;
  subtitle?: string;
  description?: string;
  points?: string[];
  cta?: { label: string; to: string };
  cards?: CustomPricingCard[];
}

export default function CustomPricingSection({
  chip,
  title,
  subtitle,
  description,
  points = [],
  cta,
  cards = [],
}: CustomPricingSectionProps) {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-6 lg:px-10">
      <div className="grid gap-8 rounded-2xl border border-rose-100 bg-rose-50/70 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
        <div>
          {chip && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold tracking-wider text-rose-600 uppercase">
              <Icon name="xMark" strokeWidth={3} className="h-3 w-3" />
              {chip}
            </span>
          )}

          <h2 className="text-brand-900 mt-4 flex items-center gap-2.5 text-3xl font-extrabold tracking-tight">
            <Icon
              name="xMark"
              strokeWidth={3}
              className="h-7 w-7 shrink-0 text-rose-600"
            />
            {title}
          </h2>
          {subtitle && (
            <p className="text-brand-900 mt-2 text-lg font-semibold">
              {subtitle}
            </p>
          )}
          {description && (
            <p className="text-brand-700/80 mt-3 max-w-md text-sm leading-relaxed">
              {description}
            </p>
          )}

          <ul className="mt-5 space-y-2.5">
            {points.map((point) => (
              <li
                key={point}
                className="text-brand-800 flex items-center gap-2.5 text-sm"
              >
                <Icon
                  name="checkCircle"
                  className="h-4.5 w-4.5 shrink-0 text-rose-500"
                />
                {point}
              </li>
            ))}
          </ul>

          {cta && (
            <Link
              href={cta.to}
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
            >
              {cta.label}
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          )}
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <li
              key={card.title}
              className="flex flex-col rounded-xl border border-rose-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <Icon name={card.icon} className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-brand-900 font-bold">{card.title}</h3>
                  {card.tag && (
                    <span className="mt-1 inline-block rounded border border-rose-200 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-rose-600 uppercase">
                      {card.tag}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-brand-700/80 mt-3 text-sm leading-snug">
                {card.description}
              </p>

              <ImageSlot
                src={card.image?.src}
                label={card.image?.label ?? card.title}
                alt={card.image?.label ?? card.title}
                fit="contain"
                className="mt-3 aspect-[4/3] w-full flex-1 rounded-lg"
              />

              {card.cta && (
                <Link
                  href={card.cta.to}
                  className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                >
                  {card.cta.label}
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
