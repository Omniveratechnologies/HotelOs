import DashboardMockup from "./DashboardMockup.jsx";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-ivory to-cream -z-10" />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-14 pb-20 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <span className="inline-block text-xs font-medium tracking-wide text-gold bg-gold/10 border border-gold/20 rounded-full px-3.5 py-1.5 mb-6">
            The Intelligent Operating System for Modern Hotels
          </span>
          <h1 className="font-display text-5xl sm:text-6xl leading-[1.05] font-semibold text-navy mb-6">
            One Hotel.
            <br />
            One <span className="text-gold">Intelligent OS.</span>
          </h1>
          <p className="text-navy/70 text-lg leading-relaxed max-w-md mb-8">
            HotelOS unifies every department, streamlines every workflow, and
            puts every guest at the heart of a smarter stay — all in one
            software.
          </p>
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <a
              href="#demo"
              className="inline-flex items-center gap-2 bg-navy text-cream font-medium rounded-full px-6 py-3.5 hover:bg-navy-dark transition-colors"
            >
              Request a Demo
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="#F4F4E4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 border border-beige-border text-navy font-medium rounded-full px-6 py-3.5 hover:border-gold hover:text-gold transition-colors"
            >
              Explore Features
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted">
            {["PCI DSS Compliant", "Secure & Reliable", "Trusted by Hotels"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
                    stroke="#766242"
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
              items: ["Room 302 — Towels", "Room 214 — Late checkout", "Room 108 — Room service"],
            }}
            className="max-w-md ml-auto"
          />
          <div className="absolute -bottom-6 -left-6 bg-cream border border-beige-border rounded-xl shadow-soft px-4 py-3 flex items-center gap-3 max-w-[230px]">
            <span className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-cream text-xs font-semibold shrink-0">
              AI
            </span>
            <p className="text-[11px] text-navy/80 leading-snug">
              Hi! I'm ready to help with today's operations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
