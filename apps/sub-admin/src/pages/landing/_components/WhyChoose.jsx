const reasons = [
  {
    title: "Unified Workflows",
    desc: "Connect every department on a single intelligent platform.",
    icon: (
      <path
        d="M4 7l8-4 8 4-8 4-8-4zM4 12l8 4 8-4M4 17l8 4 8-4"
        stroke="#766242"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Real-Time Insights",
    desc: "Live dashboards and alerts to make faster, better decisions.",
    icon: (
      <path
        d="M4 20V10M11 20V4M18 20v-7"
        stroke="#766242"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    ),
  },
  {
    title: "Guest-Centered Care",
    desc: "Everything you need to deliver safer, better guest experiences.",
    icon: (
      <path
        d="M12 21s-7-4.35-9.5-8.5C.7 8.6 2.6 5 6.2 5c2 0 3.4 1.1 4 2.2C10.8 6.1 12.2 5 14.2 5c3.6 0 5.5 3.6 3.7 7.5C15.4 16.65 12 21 12 21z"
        stroke="#766242"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Secure & Compliant",
    desc: "Built with enterprise-grade security and global standards.",
    icon: (
      <path
        d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        stroke="#766242"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Scalable & Reliable",
    desc: "Grow confidently with a platform built for the future.",
    icon: (
      <path
        d="M3 21h18M6 21V10l6-5 6 5v11M10 21v-6h4v6"
        stroke="#766242"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
];

export default function WhyChoose() {
  return (
    <section id="features" className="bg-cream py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <h2 className="mb-16 text-center font-display text-4xl font-semibold text-navy">
          Why Hotels Choose HotelOS
        </h2>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {reasons.map((r) => (
            <div key={r.title} className="text-center">
              <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-gold/20 bg-gold/10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  {r.icon}
                </svg>
              </span>
              <p className="mb-1.5 font-medium text-navy">{r.title}</p>
              <p className="text-sm leading-relaxed text-navy/60">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
