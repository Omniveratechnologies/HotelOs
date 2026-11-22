import { Icon } from "../../marketing/components/MarketingIcons.jsx";

const ITEMS = [
  { icon: "bed", label: "Property\nManagement" },
  { icon: "utensils", label: "Restaurant\nPOS" },
  { icon: "bell", label: "Front Desk &\nReservations" },
  { icon: "users", label: "Housekeeping\n& Staff" },
  { icon: "barChart", label: "Reports &\nAnalytics" },
  { icon: "star", label: "Guest Experience\n& Loyalty" },
];

/** Row of six platform highlights shown under the hero. */
export default function PlatformStrip() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
      <ul className="lg:divide-surface-200 grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x">
        {ITEMS.map((item) => (
          <li
            key={item.icon}
            className="flex items-center gap-4 px-4 first:pl-0"
          >
            <span className="border-surface-200 text-brand-900 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm">
              <Icon name={item.icon} className="h-6 w-6" />
            </span>
            <span className="text-brand-900 text-sm leading-snug font-medium whitespace-pre-line">
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
