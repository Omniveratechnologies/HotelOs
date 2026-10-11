export default function CTA() {
  return (
    <section id="demo" className="bg-white py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="bg-brand-900 items-center justify-between gap-6 rounded-2xl px-8 py-10 sm:flex">
          <div className="mb-6 flex items-start gap-4 sm:mb-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="16"
                  rx="2"
                  stroke="var(--color-surface-50)"
                  strokeWidth="1.6"
                />
                <path
                  d="M3 9h18M8 3v4M16 3v4"
                  stroke="var(--color-surface-50)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div>
              <p className="font-display mb-1 text-2xl font-semibold text-white">
                Ready to Transform Your Hotel?
              </p>
              <p className="text-sm text-white/60">
                Schedule a personalized demo and see HotelOS in action.
              </p>
            </div>
          </div>
          <a
            href="#demo"
            className="bg-primary-400 hover:bg-primary-500 inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3.5 font-medium text-white transition-colors"
          >
            Book a Demo
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
        </div>
      </div>
    </section>
  );
}
