import Link from "next/link";
import ImageSlot from "@/components/ui/ImageSlot";
import { Icon } from "@/components/ui/MarketingIcons";
import { ROUTES } from "@/data/siteContent";
import { THEMES } from "@/data/themes";

const t = THEMES.gold;

const BARS = ["h-8", "h-10", "h-12", "h-14", "h-16", "h-20", "h-24"];

export interface GrowthBannerProps {
  backgroundSrc?: string;
}

export default function GrowthBanner({ backgroundSrc }: GrowthBannerProps) {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
      <div className="bg-brand-950 relative isolate overflow-hidden rounded-3xl px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-12">
        <ImageSlot
          src={backgroundSrc}
          label="Hotel at night"
          tone="dark"
          className="absolute inset-0 -z-10"
        />
        <div className="from-brand-950 via-brand-950/85 to-brand-950/40 absolute inset-0 -z-10 bg-linear-to-r" />

        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="max-w-lg text-3xl leading-tight font-bold sm:text-4xl">
              Turn Your Hospitality Business Into a Growth Machine
            </h2>
            <p className="mt-3 max-w-md text-sm text-white/80">
              Join 1000+ hotels and restaurants already growing with HotelOS.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={ROUTES.requestDemo}
                className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors ${t.solidButton}`}
              >
                Request a Demo
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link
                href={ROUTES.requestDemo}
                className="inline-flex items-center rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Contact Sales
              </Link>
            </div>
          </div>

          <div className="text-brand-900 rounded-2xl bg-white p-6 shadow-xl lg:justify-self-end">
            <div className="flex items-end justify-between gap-8">
              <div>
                <p className="text-sm font-semibold">Revenue Growth</p>
                <p className="mt-2 text-5xl leading-none font-extrabold text-green-600">
                  +62%
                </p>
                <p className="text-brand-700/80 mt-3 max-w-[11rem] text-xs">
                  Average growth seen by our customers within 6 months
                </p>
              </div>
              <div aria-hidden="true" className="flex h-24 items-end gap-1.5">
                {BARS.map((height) => (
                  <span
                    key={height}
                    className={`w-3 rounded-t bg-linear-to-t from-[#e8c071] to-[#f6e3b4] ${height}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
