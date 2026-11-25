import ImageSlot from "@/components/ui/ImageSlot";
import { Icon } from "@/components/ui/MarketingIcons";
import type { HardwareItem } from "../_types/managementTypes";

export type { HardwareItem };

export interface HardwareGridProps {
  label?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  items?: HardwareItem[];
  images?: Record<string, string>;
  detailsLabel?: string;
  onViewDetails?: (item: HardwareItem) => void;
}

export default function HardwareGrid({
  label,
  title,
  description,
  ctaLabel,
  items = [],
  images = {},
  detailsLabel = "View Details",
  onViewDetails,
}: HardwareGridProps) {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {label && (
            <p className="text-xs font-bold tracking-[0.18em] text-[#c9962c] uppercase">
              {label}
            </p>
          )}
          <h2 className="text-brand-900 mt-2 text-3xl font-extrabold tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-brand-700/80 mt-2 max-w-xl text-sm">
              {description}
            </p>
          )}
        </div>

        {ctaLabel && (
          <button
            type="button"
            className="bg-brand-900 hover:bg-brand-800 inline-flex cursor-pointer items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white transition-colors"
          >
            {ctaLabel}
            <Icon name="arrowRight" className="h-4 w-4" />
          </button>
        )}
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <li
            key={item.title}
            className="border-surface-200 flex flex-col items-center rounded-xl border bg-white p-4 text-center shadow-sm"
          >
            <ImageSlot
              src={images[item.imageKey]}
              label={item.title}
              alt={item.title}
              fit="contain"
              className="aspect-[4/3] w-full rounded-lg"
            />
            <h3 className="text-brand-900 mt-4 text-sm font-semibold">
              {item.title}
            </h3>
            <p className="text-brand-700/80 mt-1 flex-1 text-xs leading-snug">
              {item.description}
            </p>
            <button
              type="button"
              onClick={() => onViewDetails?.(item)}
              className="border-surface-300 text-brand-900 hover:bg-background-100 mt-4 w-full cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold transition-colors"
            >
              {detailsLabel}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
