import { Icon } from "../../marketing/components/MarketingIcons.jsx";

const TONES = {
  gold: "bg-[#fdf1dd] text-[#e0932b]",
  blue: "bg-blue-50 text-blue-500",
};

const STATS = [
  { icon: "users", tone: "gold", value: "1000+", label: "Happy Customers" },
  { icon: "box", tone: "blue", value: "2M+", label: "Orders Processed" },
  { icon: "clock", tone: "blue", value: "99.9%", label: "Uptime" },
  { icon: "star", tone: "gold", value: "4.8/5", label: "Customer Rating" },
];

/** Four headline numbers in one card. */
export default function StatsBar() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-6 lg:px-10">
      <ul className="border-surface-200 lg:divide-surface-200 grid grid-cols-2 gap-6 rounded-2xl border bg-white p-6 shadow-sm lg:grid-cols-4 lg:divide-x">
        {STATS.map((stat) => (
          <li
            key={stat.label}
            className="flex items-center gap-4 lg:justify-center"
          >
            <span
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${TONES[stat.tone]}`}
            >
              <Icon name={stat.icon} className="h-7 w-7" />
            </span>
            <span>
              <span className="text-brand-900 block text-3xl leading-none font-extrabold">
                {stat.value}
              </span>
              <span className="text-brand-700/80 mt-1 block text-sm">
                {stat.label}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
