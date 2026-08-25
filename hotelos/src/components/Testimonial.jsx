export default function Testimonial() {
  return (
    <section className="py-16 bg-ivory">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-cream border border-beige-border rounded-2xl shadow-card px-8 py-10 flex flex-col sm:flex-row items-center gap-6">
          <span className="text-5xl font-display text-gold shrink-0 leading-none">&ldquo;</span>
          <div>
            <p className="text-navy/80 leading-relaxed mb-5">
              HotelOS has transformed the way we manage our property. From
              check-in to checkout, everything is now streamlined and
              transparent. Our staff is happier, our operations are smoother,
              and our guests feel the difference.
            </p>
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-navy text-cream flex items-center justify-center font-display font-semibold text-lg">
                R
              </span>
              <div>
                <p className="text-sm font-medium text-navy">Rohan Kapoor</p>
                <p className="text-xs text-muted">General Manager, The Lantern Grand Hotel</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
