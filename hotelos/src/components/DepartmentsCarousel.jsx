import { useRef, useState } from "react";
import DashboardMockup from "./DashboardMockup.jsx";

const departments = [
  {
    name: "Front Desk Dashboard",
    label: "HotelOS · Front Desk",
    greeting: "Welcome, Aria Whitfield",
    stats: [
      { label: "Total Rooms", value: "180" },
      { label: "Check-ins", value: "24" },
      { label: "Checkouts", value: "17" },
      { label: "Occupied", value: "142" },
    ],
    chart: { percent: 79, label: "Occupancy" },
    list: { title: "Guest requests", items: ["Room 302 — Towels", "Room 214 — Late checkout", "Room 108 — Room service"] },
  },
  {
    name: "Housekeeping Dashboard",
    label: "HotelOS · Housekeeping",
    greeting: "Today's assignments",
    stats: [
      { label: "Rooms to Clean", value: "38" },
      { label: "In Progress", value: "12" },
      { label: "Completed", value: "26" },
      { label: "Staff Active", value: "14" },
    ],
    chart: { percent: 68, label: "Completed" },
    list: { title: "Priority rooms", items: ["Room 410 — Checkout clean", "Room 118 — Inspection", "Room 305 — Maintenance"] },
  },
  {
    name: "Guest Portal",
    label: "HotelOS · Guest Portal",
    greeting: "Welcome back, Ethan Cole",
    stats: [
      { label: "Reservation", value: "#4821" },
      { label: "Nights", value: "3" },
      { label: "Loyalty Pts", value: "1.2k" },
      { label: "Balance", value: "$0" },
    ],
    chart: { percent: 100, label: "Stay progress" },
    list: { title: "Quick actions", items: ["Request late checkout", "Order room service", "Book spa slot"] },
  },
  {
    name: "Manager Dashboard",
    label: "HotelOS · Manager",
    greeting: "Property overview",
    stats: [
      { label: "Revenue", value: "$18.4k" },
      { label: "ADR", value: "$212" },
      { label: "RevPAR", value: "$168" },
      { label: "Staff On", value: "31" },
    ],
    chart: { percent: 92, label: "Efficiency" },
    list: { title: "Alerts", items: ["Housekeeping short-staffed", "3 pending refunds", "VIP arrival at 4 PM"] },
  },
];

export default function DepartmentsCarousel() {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  const scrollToIndex = (i) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[i];
    if (card) {
      track.scrollTo({ left: card.offsetLeft - 24, behavior: "smooth" });
      setActive(i);
    }
  };

  const shift = (dir) => {
    const next = Math.min(Math.max(active + dir, 0), departments.length - 1);
    scrollToIndex(next);
  };

  return (
    <section id="product" className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="font-display text-4xl font-semibold text-navy mb-3">
            All Departments. One Platform.
          </h2>
          <p className="text-navy/60">
            An all-in-one software designed for modern hotels, built for real-world hospitality.
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => shift(-1)}
            aria-label="Previous"
            className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-cream border border-beige-border shadow-soft items-center justify-center text-navy hover:text-gold hover:border-gold transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div
            ref={trackRef}
            className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-4"
          >
            {departments.map((d, i) => (
              <div key={d.name} className="snap-center shrink-0 w-[280px] sm:w-[340px]">
                <DashboardMockup {...d} />
                <p
                  className={`text-center mt-4 text-sm font-medium transition-colors ${
                    i === active ? "text-gold" : "text-navy/70"
                  }`}
                >
                  {d.name}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => shift(1)}
            aria-label="Next"
            className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-cream border border-beige-border shadow-soft items-center justify-center text-navy hover:text-gold hover:border-gold transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          {departments.map((d, i) => (
            <button
              key={d.name}
              aria-label={`Go to ${d.name}`}
              onClick={() => scrollToIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-6 bg-gold" : "w-1.5 bg-beige-border"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
