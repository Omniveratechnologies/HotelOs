export default function CTA() {
  return (
    <section id="demo" className="bg-cream py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="items-center justify-between gap-6 rounded-2xl bg-navy px-8 py-10 sm:flex">
          <div className="mb-6 flex items-start gap-4 sm:mb-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream/10">
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
              <p className="mb-1 font-display text-2xl font-semibold text-cream">
                Ready to Transform Your Hotel?
              </p>
              <p className="text-sm text-cream/60">
                Schedule a personalized demo and see HotelOS in action.
              </p>
            </div>
          </div>
          <a
            href="#demo"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gold px-6 py-3.5 font-medium text-cream transition-colors hover:bg-gold-hover"
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
