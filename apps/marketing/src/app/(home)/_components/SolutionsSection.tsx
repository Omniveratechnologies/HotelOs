import Link from "next/link";
import ImageSlot from "@/components/ui/ImageSlot";
import { Icon } from "@/components/ui/MarketingIcons";
import SectionHeading from "@/components/marketing/SectionHeading";
import { ROUTES } from "@/data/siteContent";

const TONES: Record<string, { tag: string; check: string; button: string }> = {
  gold: {
    tag: "text-[#c9962c]",
    check: "text-[#e0932b]",
    button: "bg-[#fbf3e4] text-[#a8761f] hover:bg-[#f6e7c9]",
  },
  blue: {
    tag: "text-blue-600",
    check: "text-blue-500",
    button: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  rose: {
    tag: "text-rose-600",
    check: "text-rose-500",
    button: "bg-rose-50 text-rose-600 hover:bg-rose-100",
  },
};

const CARDS = [
  {
    key: "pms",
    tone: "gold",
    icon: "bed",
    tag: "PMS",
    title: "HotelOS PMS",
    description: "Complete property management system for modern hotels.",
    items: [
      "Reservations & Booking Engine",
      "Front Desk & Check-in",
      "Room Management",
      "Housekeeping & Maintenance",
      "Guest Management",
      "Reports & Analytics",
    ],
    cta: "Explore PMS",
    to: ROUTES.pms,
  },
  {
    key: "pos",
    tone: "blue",
    icon: "utensils",
    tag: "POS",
    title: "Restaurant POS",
    description:
      "Powerful and easy-to-use POS for restaurants, cafés and bars.",
    items: [
      "Billing & Orders",
      "Menu Management",
      "Table Management",
      "KOT & Kitchen Display",
      "Inventory Management",
      "Payments & Integrations",
    ],
    cta: "Explore POS",
    to: ROUTES.pos,
  },
  {
    key: "xFactor",
    tone: "rose",
    icon: "xMark",
    tag: "X FACTOR",
    title: "X Factor",
    description:
      "Digital ordering & table kiosk solution to give a X factor to your business.",
    items: [
      "Table Kiosk Menu",
      "QR Code Ordering",
      "Self-Ordering Kiosks",
      "Online Ordering",
      "Menu & Offer Management",
      "Integrates with POS",
    ],
    cta: "Explore X Factor",
    to: ROUTES.xFactor,
  },
];

export interface SolutionsSectionProps {
  images: Record<string, string>;
}

export default function SolutionsSection({ images }: SolutionsSectionProps) {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
      <p className="text-center text-xs font-bold tracking-[0.18em] text-[#c9962c] uppercase">
        Our Solutions
      </p>
      <SectionHeading
        className="mt-2"
        theme="gold"
        title={[
          { text: "Everything You Need to " },
          { text: "Run and Grow", accent: true },
        ]}
        subtitle="Powerful, integrated solutions designed for modern hospitality businesses."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {CARDS.map((card) => {
          const tone = TONES[card.tone];
          return (
            <article
              key={card.key}
              className="border-surface-200 flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              <div className="relative">
                <ImageSlot
                  src={images[card.key]}
                  label={`${card.title} photo`}
                  alt={card.title}
                  className="aspect-[16/9] w-full"
                />
                <span
                  className={`absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1 text-xs font-bold shadow ${tone.tag}`}
                >
                  <Icon name={card.icon} className="h-3.5 w-3.5" />
                  {card.tag}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-brand-900 text-xl font-bold">
                  {card.title}
                </h3>
                <p className="text-brand-700/80 mt-2 text-sm leading-relaxed">
                  {card.description}
                </p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {card.items.map((item) => (
                    <li
                      key={item}
                      className="text-brand-800 flex items-center gap-2.5 text-sm"
                    >
                      <Icon
                        name="checkCircle"
                        className={`h-4.5 w-4.5 shrink-0 ${tone.check}`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href={card.to}
                  className={`mt-6 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${tone.button}`}
                >
                  {card.cta}
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
