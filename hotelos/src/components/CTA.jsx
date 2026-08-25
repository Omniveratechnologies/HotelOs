export default function CTA() {
  return (
    <section id="demo" className="py-16 bg-cream">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-navy rounded-2xl px-8 py-10 sm:flex items-center justify-between gap-6">
          <div className="flex items-start gap-4 mb-6 sm:mb-0">
            <span className="w-11 h-11 rounded-full bg-cream/10 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="#F4F4E4" strokeWidth="1.6" />
                <path d="M3 9h18M8 3v4M16 3v4" stroke="#F4F4E4" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <p className="font-display text-2xl text-cream font-semibold mb-1">
                Ready to Transform Your Hotel?
              </p>
              <p className="text-cream/60 text-sm">
                Schedule a personalized demo and see HotelOS in action.
              </p>
            </div>
          </div>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 bg-gold text-cream font-medium rounded-full px-6 py-3.5 hover:bg-gold-hover transition-colors shrink-0"
          >
            Book a Demo
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="#F4F4E4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
