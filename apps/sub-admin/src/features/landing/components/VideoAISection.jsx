const aiPoints = [
  {
    title: "Instant Answers",
    desc: "Get quick responses to queries about guests, rooms, schedules & more.",
    icon: (
      <path
        d="M12 18h.01M9.5 9a2.5 2.5 0 015 0c0 1.5-1.5 2-2 3"
        stroke="var(--color-primary-400)"
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
        stroke="var(--color-primary-400)"
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
        stroke="var(--color-primary-400)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    ),
  },
];

export default function VideoAISection() {
  return (
    <section className="bg-background-50 py-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-2 lg:px-10">
        {/* Video */}
        <div className="group bg-brand-900 relative flex aspect-4/3 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl p-8">
          <div className="from-brand-900 via-brand-900 to-brand-800 absolute inset-0 bg-linear-to-br opacity-90" />
          <div className="relative">
            <p className="font-display max-w-[220px] text-2xl leading-tight text-white sm:text-3xl">
              One Platform, Every Department
            </p>
          </div>
          <button
            aria-label="Play overview video"
            className="relative flex h-16 w-16 items-center justify-center self-center rounded-full bg-white/95 transition-transform group-hover:scale-105"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="var(--color-brand-900)"
            >
              <path d="M8 5v14l11-7-11-7z" />
            </svg>
          </button>
          <div className="relative flex items-center justify-between text-xs text-white/70">
            <span>HotelOS Overview</span>
            <span>02:15</span>
          </div>
        </div>

        {/* AI description */}
        <div>
          <span className="border-primary-400/20 bg-primary-400/10 text-primary-400 mb-4 inline-block rounded-full border px-3.5 py-1.5 text-xs font-medium tracking-wide">
            AI Assistant for Smarter Care
          </span>
          <h2 className="font-display text-brand-900 mb-3 text-3xl font-semibold">
            Every Dashboard, Powered by AI
          </h2>
          <p className="text-brand-900/60 mb-8 max-w-md">
            All HotelOS dashboards are AI-powered — the built-in assistant helps
            staff and guests get instant answers, automates routine tasks, and
            improves efficiency across every department.
          </p>
          <div className="space-y-6">
            {aiPoints.map((p) => (
              <div key={p.title} className="flex gap-4">
                <span className="border-primary-400/20 bg-primary-400/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    {p.icon}
                  </svg>
                </span>
                <div>
                  <p className="text-brand-900 mb-0.5 font-medium">{p.title}</p>
                  <p className="text-brand-900/60 text-sm">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
