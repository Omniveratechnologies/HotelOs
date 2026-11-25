import Link from "next/link";
import { Icon } from "@/components/ui/MarketingIcons";

const TONES = {
  blue: {
    card: "border-blue-100 bg-[#f5f8ff]",
    tile: "bg-blue-100 text-blue-600",
    tag: "bg-blue-100 text-blue-600",
    check: "text-blue-600",
    button: "bg-brand-900 text-white hover:bg-brand-800",
  },
  gold: {
    card: "border-[#f3e2bd] bg-[#fff8ec]",
    tile: "bg-[#fdf1dd] text-[#e0932b]",
    tag: "bg-[#fdf1dd] text-[#c9962c]",
    check: "text-[#e0932b]",
    button: "bg-[#d4a02f] text-white hover:bg-[#c08f22]",
  },
};

export interface PricingPlanPrice {
  currency: string;
  amount: string;
  unit: string;
}

export interface PricingPlanCardProps {
  tone?: "blue" | "gold";
  icon: string;
  title: string;
  tag?: string;
  description: string;
  price: PricingPlanPrice;
  note?: string;
  features?: string[];
  cta?: { label: string; to: string };
}

export default function PricingPlanCard({
  tone = "blue",
  icon,
  title,
  tag,
  description,
  price,
  note,
  features = [],
  cta,
}: PricingPlanCardProps) {
  const t = TONES[tone];

  return (
    <article
      className={`flex flex-col rounded-2xl border p-6 shadow-sm sm:p-8 ${t.card}`}
    >
      <header className="flex items-start gap-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${t.tile}`}
        >
          <Icon name={icon} className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-brand-900 text-2xl font-bold">{title}</h3>
            {tag && (
              <span
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase ${t.tag}`}
              >
                {tag}
              </span>
            )}
          </div>
          <p className="text-brand-700/80 mt-2 max-w-sm text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </header>

      <div className="mt-6">
        <p className="text-brand-900 flex flex-wrap items-baseline gap-x-2">
          <span className="text-5xl leading-none font-extrabold">
            {price.currency} {price.amount}
          </span>
          <span className="text-brand-700/80 text-base">{price.unit}</span>
        </p>
        {note && <p className="text-brand-700/80 mt-2 text-sm">{note}</p>}
      </div>

      <ul className="mt-6 grid flex-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {features.map((feature) => (
          <li
            key={feature}
            className="text-brand-800 flex items-start gap-2.5 text-[13px]"
          >
            <Icon
              name="checkCircle"
              className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${t.check}`}
            />
            {feature}
          </li>
        ))}
      </ul>

      {cta && (
        <Link
          href={cta.to}
          className={`mt-8 flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold transition-colors ${t.button}`}
        >
          {cta.label}
          <Icon name="arrowRight" className="h-4 w-4" />
        </Link>
      )}
    </article>
  );
}
