export default function CTA() {
  return (
    <section id="demo" className="bg-cream py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="bg-navy items-center justify-between gap-6 rounded-2xl px-8 py-10 sm:flex">
          <div className="mb-6 flex items-start gap-4 sm:mb-0">
            <span className="bg-cream/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="16"
                  rx="2"
                  stroke="#F4F4E4"
                  strokeWidth="1.6"
                />
                <path
                  d="M3 9h18M8 3v4M16 3v4"
                  stroke="#F4F4E4"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div>
              <p className="font-display text-cream mb-1 text-2xl font-semibold">
                Ready to Transform Your Hotel?
              </p>
              <p className="text-cream/60 text-sm">
                Schedule a personalized demo and see HotelOS in action.
              </p>
            </div>
          </div>
          <a
            href="#demo"
            className="bg-gold text-cream hover:bg-gold-hover inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3.5 font-medium transition-colors"
          >
            Book a Demo
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="#F4F4E4"
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
