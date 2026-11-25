import ImageSlot from "@/components/ui/ImageSlot";
import { Icon } from "@/components/ui/MarketingIcons";

export interface HospitalityCard {
  icon: string;
  title: string;
  description: string;
}

export interface HospitalityBandProps {
  label?: string;
  title: string;
  description?: string;
  cards?: HospitalityCard[];
  backgroundSrc?: string;
}

export default function HospitalityBand({
  label,
  title,
  description,
  cards = [],
  backgroundSrc,
}: HospitalityBandProps) {
  return (
    <section className="bg-brand-950 relative isolate overflow-hidden text-white">
      <ImageSlot
        src={backgroundSrc}
        label="Restaurant interior"
        tone="dark"
        className="absolute inset-0 -z-10"
      />
      <div className="from-brand-950 via-brand-950/80 to-brand-950/40 absolute inset-0 -z-10 bg-linear-to-r" />

      <div className="mx-auto max-w-[1400px] px-6 py-14 lg:px-10">
        {label && (
          <p className="text-xs font-bold tracking-[0.18em] text-[#e6b84d] uppercase">
            {label}
          </p>
        )}
        <h2 className="mt-3 max-w-xl text-4xl leading-tight font-extrabold tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80">
            {description}
          </p>
        )}

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <li
              key={card.title}
              className="text-brand-900 flex items-center gap-4 rounded-xl bg-white p-4 shadow-lg"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#fdf1dd] text-[#e0932b]">
                <Icon name={card.icon} className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-sm font-bold">{card.title}</h3>
                <p className="text-brand-700/80 mt-0.5 text-xs leading-snug">
                  {card.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
