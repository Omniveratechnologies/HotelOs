export default function Testimonial() {
  return (
    <section className="bg-ivory py-16">
      <div className="mx-auto max-w-4xl px-6">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-beige-border bg-cream px-8 py-10 shadow-card sm:flex-row">
          <span className="shrink-0 font-display text-5xl leading-none text-gold">
            &ldquo;
          </span>
          <div>
            <p className="mb-5 leading-relaxed text-navy/80">
              HotelOS has transformed the way we manage our property. From
              check-in to checkout, everything is now streamlined and
              transparent. Our staff is happier, our operations are smoother,
              and our guests feel the difference.
            </p>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy font-display text-lg font-semibold text-cream">
                R
              </span>
              <div>
                <p className="text-sm font-medium text-navy">Rohan Kapoor</p>
                <p className="text-xs text-muted">
                  General Manager, The Lantern Grand Hotel
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
