const aiPoints = [
  {
    title: "Instant Answers",
    desc: "Get quick responses to queries about guests, rooms, schedules & more.",
    icon: (
      <path
        d="M12 18h.01M9.5 9a2.5 2.5 0 015 0c0 1.5-1.5 2-2 3"
        stroke="#766242"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    ),
  },
  {
    title: "Smart Recommendations",
    desc: "AI suggests actions, alerts, and next best steps for every shift.",
    icon: (
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"
        stroke="#766242"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    ),
  },
  {
    title: "24/7 Support",
    desc: "Always available for staff and guests, day or night.",
    icon: (
      <path
        d="M12 8v4l2.5 2.5M12 3a9 9 0 100 18 9 9 0 000-18z"
        stroke="#766242"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    ),
  },
];

export default function VideoAISection() {
  return (
    <section className="bg-ivory py-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-2 lg:px-10">
        {/* Video */}
        <div className="group relative flex aspect-[4/3] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl bg-navy p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-navy-dark opacity-90" />
          <div className="relative">
            <p className="max-w-[220px] font-display text-2xl leading-tight text-cream sm:text-3xl">
              One Platform, Every Department
            </p>
          </div>
          <button
            aria-label="Play overview video"
            className="relative flex h-16 w-16 items-center justify-center self-center rounded-full bg-cream/95 transition-transform group-hover:scale-105"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#22324E">
              <path d="M8 5v14l11-7-11-7z" />
            </svg>
          </button>
          <div className="relative flex items-center justify-between text-xs text-cream/70">
            <span>HotelOS Overview</span>
            <span>02:15</span>
          </div>
        </div>

        {/* AI description */}
        <div>
          <span className="mb-4 inline-block rounded-full border border-gold/20 bg-gold/10 px-3.5 py-1.5 text-xs font-medium tracking-wide text-gold">
            AI Assistant for Smarter Care
          </span>
          <h2 className="mb-3 font-display text-3xl font-semibold text-navy">
            Every Dashboard, Powered by AI
          </h2>
          <p className="mb-8 max-w-md text-navy/60">
            All HotelOS dashboards are AI-powered — the built-in assistant helps
            staff and guests get instant answers, automates routine tasks, and
            improves efficiency across every department.
          </p>
          <div className="space-y-6">
            {aiPoints.map((p) => (
              <div key={p.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    {p.icon}
                  </svg>
                </span>
                <div>
                  <p className="mb-0.5 font-medium text-navy">{p.title}</p>
                  <p className="text-sm text-navy/60">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
