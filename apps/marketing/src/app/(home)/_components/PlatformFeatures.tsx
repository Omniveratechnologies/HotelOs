import { Icon } from "@/components/ui/MarketingIcons";
import SectionHeading from "@/components/marketing/SectionHeading";

const FEATURES = [
  {
    icon: "globe",
    title: "Channel Manager",
    description: "Sync with multiple OTAs",
  },
  {
    icon: "layoutGrid",
    title: "Unified Dashboard",
    description: "PMS + POS + X Factor in one view",
  },
  {
    icon: "box",
    title: "Inventory Management",
    description: "Track stock in real-time",
  },
  {
    icon: "building",
    title: "Multi-Property Support",
    description: "Manage multiple locations",
  },
  {
    icon: "barChart",
    title: "Reports & Analytics",
    description: "Data-driven decisions",
  },
  {
    icon: "card",
    title: "Payments & Integrations",
    description: "UPI, Cards, Wallets, OTAs",
  },
  {
    icon: "users",
    title: "Staff Management",
    description: "Roles & permissions",
  },
  {
    icon: "smartphone",
    title: "Mobile Access",
    description: "Manage on the go",
  },
];

export default function PlatformFeatures() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
      <p className="text-center text-xs font-bold tracking-[0.18em] text-[#c9962c] uppercase">
        Powerful Features
      </p>
      <SectionHeading
        className="mt-2"
        theme="gold"
        title="Everything in One Integrated Platform"
      />

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <li
            key={feature.title}
            className="border-surface-200 flex items-start gap-4 rounded-xl border bg-white p-5 shadow-sm"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon name={feature.icon} className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-brand-900 text-[15px] font-semibold">
                {feature.title}
              </h3>
              <p className="text-brand-700/80 mt-1 text-sm leading-snug">
                {feature.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
