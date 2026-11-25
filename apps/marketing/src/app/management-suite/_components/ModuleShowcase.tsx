import { Icon } from "@/components/ui/MarketingIcons";

export interface ShowcaseItem {
  icon: string;
  title: string;
  description: string;
}

export interface ModuleShowcaseProps {
  label?: string;
  title: string;
  description?: string;
  items?: ShowcaseItem[];
}

export default function ModuleShowcase({
  label,
  title,
  description,
  items = [],
}: ModuleShowcaseProps) {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
      <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          {label && (
            <p className="text-xs font-bold tracking-[0.18em] text-[#c9962c] uppercase">
              {label}
            </p>
          )}
          <h2 className="text-brand-900 mt-3 text-4xl leading-tight font-extrabold tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-brand-700/80 mt-4 max-w-md text-base leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {items.map((item) => (
            <li
              key={item.title}
              className="flex flex-col rounded-xl bg-[#fdf6e8] p-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fdf1dd] text-[#e0932b]">
                <Icon name={item.icon} className="h-5 w-5" />
              </span>
              <h3 className="text-brand-900 mt-3 text-sm font-semibold">
                {item.title}
              </h3>
              <p className="text-brand-700/80 mt-1 text-xs leading-snug">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
