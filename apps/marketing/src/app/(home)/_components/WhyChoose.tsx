import Link from "next/link";
import ImageSlot from "@/components/ui/ImageSlot";
import { Icon } from "@/components/ui/MarketingIcons";
import { ROUTES } from "@/data/siteContent";
import { THEMES } from "@/data/themes";

const t = THEMES.gold;

const POINTS = [
  "Increase operational efficiency",
  "Reduce manual work",
  "Improve guest & customer experience",
  "Gain real-time insights",
  "Grow your revenue",
];

const COLLAGE = [
  {
    key: "hotels",
    area: "row-span-2",
    icon: "bed",
    title: "Hotels",
    subtitle: "PMS Solution",
    tile: "bg-[#fdf1dd] text-[#e0932b]",
  },
  {
    key: "restaurants",
    area: "",
    icon: "utensils",
    title: "Restaurants",
    subtitle: "POS Solution",
    tile: "bg-[#fdf1dd] text-[#e0932b]",
  },
  {
    key: "xFactor",
    area: "",
    icon: "xMark",
    title: "X Factor",
    subtitle: "Digital Ordering",
    tile: "bg-rose-50 text-rose-600",
  },
];

export interface WhyChooseProps {
  images: Record<string, string>;
}

export default function WhyChoose({ images }: WhyChooseProps) {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
      <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-[#c9962c] uppercase">
            Why HotelOS
          </p>
          <h2 className="text-brand-900 mt-3 text-4xl leading-tight font-extrabold tracking-tight">
            Built for Real Business Needs
          </h2>
          <p className="text-brand-700/80 mt-4 max-w-md text-base leading-relaxed">
            From front desk to kitchen, from online bookings to table ordering —
            HotelOS connects every part of your operation.
          </p>

          <ul className="mt-6 space-y-3">
            {POINTS.map((point) => (
              <li
                key={point}
                className="text-brand-800 flex items-center gap-3 text-[15px]"
              >
                <Icon
                  name="checkCircle"
                  className={`h-5 w-5 shrink-0 ${t.check}`}
                />
                {point}
              </li>
            ))}
          </ul>

          <Link
            href={ROUTES.requestDemo}
            className={`mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors ${t.solidButton}`}
          >
            Request a Demo
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid h-[26rem] grid-cols-[1.1fr_1fr] grid-rows-2 gap-4 sm:h-[32rem]">
          {COLLAGE.map((item) => (
            <div key={item.key} className={`relative ${item.area}`}>
              <ImageSlot
                src={images[item.key]}
                label={`${item.title} photo`}
                alt={item.title}
                className="h-full w-full rounded-2xl"
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-2.5 rounded-xl bg-white/95 px-3 py-2 shadow-lg">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.tile}`}
                >
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                <span>
                  <span className="text-brand-900 block text-sm leading-tight font-bold">
                    {item.title}
                  </span>
                  <span className="text-brand-700/70 block text-[11px]">
                    {item.subtitle}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
