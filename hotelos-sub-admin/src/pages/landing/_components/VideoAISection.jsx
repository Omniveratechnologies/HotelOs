const aiPoints = [
  {
    title: "Instant Answers",
    desc: "Get quick responses to queries about guests, rooms, schedules & more.",
    icon: (
      <path d="M12 18h.01M9.5 9a2.5 2.5 0 015 0c0 1.5-1.5 2-2 3" stroke="#766242" strokeWidth="1.6" strokeLinecap="round" />
    ),
  },
  {
    title: "Smart Recommendations",
    desc: "AI suggests actions, alerts, and next best steps for every shift.",
    icon: <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" stroke="#766242" strokeWidth="1.6" strokeLinecap="round" />,
  },
  {
    title: "24/7 Support",
    desc: "Always available for staff and guests, day or night.",
    icon: <path d="M12 8v4l2.5 2.5M12 3a9 9 0 100 18 9 9 0 000-18z" stroke="#766242" strokeWidth="1.6" strokeLinecap="round" />,
  },
];

export default function VideoAISection() {
  return (
    <section className="py-16 bg-ivory">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-8">
        {/* Video */}
        <div className="rounded-2xl bg-navy overflow-hidden relative aspect-[4/3] flex flex-col justify-between p-8 group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-navy-dark opacity-90" />
          <div className="relative">
            <p className="font-display text-2xl sm:text-3xl text-cream leading-tight max-w-[220px]">
              One Platform, Every Department
            </p>
          </div>
          <button
            aria-label="Play overview video"
            className="relative self-center w-16 h-16 rounded-full bg-cream/95 flex items-center justify-center group-hover:scale-105 transition-transform"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#22324E">
              <path d="M8 5v14l11-7-11-7z" />
            </svg>
          </button>
          <div className="relative flex items-center justify-between text-cream/70 text-xs">
            <span>HotelOS Overview</span>
            <span>02:15</span>
          </div>
        </div>

        {/* AI description */}
        <div>
          <span className="inline-block text-xs font-medium tracking-wide text-gold bg-gold/10 border border-gold/20 rounded-full px-3.5 py-1.5 mb-4">
            AI Assistant for Smarter Care
          </span>
          <h2 className="font-display text-3xl font-semibold text-navy mb-3">
            Every Dashboard, Powered by AI
          </h2>
          <p className="text-navy/60 mb-8 max-w-md">
            All HotelOS dashboards are AI-powered — the built-in assistant
            helps staff and guests get instant answers, automates routine
            tasks, and improves efficiency across every department.
          </p>
          <div className="space-y-6">
            {aiPoints.map((p) => (
              <div key={p.title} className="flex gap-4">
                <span className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    {p.icon}
                  </svg>
                </span>
                <div>
                  <p className="font-medium text-navy mb-0.5">{p.title}</p>
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
