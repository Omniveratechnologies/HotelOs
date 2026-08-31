export default function Testimonial() {
  return (
    <section className="bg-ivory py-16">
      <div className="mx-auto max-w-4xl px-6">
        <div className="border-beige-border bg-cream shadow-card flex flex-col items-center gap-6 rounded-2xl border px-8 py-10 sm:flex-row">
          <span className="font-display text-gold shrink-0 text-5xl leading-none">
            &ldquo;
          </span>
          <div>
            <p className="text-navy/80 mb-5 leading-relaxed">
              HotelOS has transformed the way we manage our property. From
              check-in to checkout, everything is now streamlined and
              transparent. Our staff is happier, our operations are smoother,
              and our guests feel the difference.
            </p>
            <div className="flex items-center gap-3">
              <span className="bg-navy font-display text-cream flex h-11 w-11 items-center justify-center rounded-full text-lg font-semibold">
                R
              </span>
              <div>
                <p className="text-navy text-sm font-medium">Rohan Kapoor</p>
                <p className="text-muted text-xs">
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
