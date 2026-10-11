import DashboardMockup from "./DashboardMockup.jsx";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="from-background-50 absolute inset-0 -z-10 bg-linear-to-b to-white" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 pt-14 pb-20 lg:grid-cols-2 lg:px-10">
        <div>
          <span className="border-primary-400/20 bg-primary-400/10 text-primary-400 mb-6 inline-block rounded-full border px-3.5 py-1.5 text-xs font-medium tracking-wide">
            The Intelligent Operating System for Modern Hotels
          </span>
          <h1 className="font-display text-brand-900 mb-6 text-5xl leading-[1.05] font-semibold sm:text-6xl">
            One Hotel.
            <br />
            One <span className="text-primary-400">Intelligent OS.</span>
          </h1>
          <p className="text-brand-900/70 mb-8 max-w-md text-lg leading-relaxed">
            HotelOS unifies every department, streamlines every workflow, and
            puts every guest at the heart of a smarter stay — all in one
            software.
          </p>
          <div className="mb-8 flex flex-wrap items-center gap-4">
            <a
              href="#demo"
              className="bg-brand-900 hover:bg-brand-800 inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-medium text-white transition-colors"
            >
              Request a Demo
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="var(--color-surface-50)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a
              href="#features"
              className="text-brand-900 hover:border-primary-400 hover:text-primary-500 inline-flex items-center gap-2 rounded-full border border-gray-200 px-6 py-3.5 font-medium transition-colors"
            >
              Explore Features
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
            {[
              "PCI DSS Compliant",
              "Secure & Reliable",
              "Trusted by Hotels",
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
                    stroke="var(--color-primary-400)"
                    strokeWidth="1.6"
                  />
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <DashboardMockup
            label="HotelOS · Front Desk"
            greeting="Welcome, Aria Whitfield"
            stats={[
              { label: "Total Rooms", value: "180" },
              { label: "Check-ins", value: "24" },
              { label: "Checkouts", value: "17" },
              { label: "Occupied", value: "142" },
            ]}
            chart={{ percent: 79, label: "Occupancy" }}
            list={{
              title: "Guest requests",
              items: [
                "Room 302 — Towels",
                "Room 214 — Late checkout",
                "Room 108 — Room service",
              ],
            }}
            className="ml-auto max-w-md"
          />
          <div className="absolute -bottom-6 -left-6 flex max-w-[230px] items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-md">
            <span className="bg-brand-900 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white">
              AI
            </span>
            <p className="text-brand-900/80 text-[11px] leading-snug">
              Hi! I'm ready to help with today's operations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
