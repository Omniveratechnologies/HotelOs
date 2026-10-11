export default function Testimonial() {
  return (
    <section className="bg-background-50 py-16">
      <div className="mx-auto max-w-4xl px-6">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-gray-100 bg-white px-8 py-10 shadow-xs sm:flex-row">
          <span className="font-display text-primary-400 shrink-0 text-5xl leading-none">
            &ldquo;
          </span>
          <div>
            <p className="text-brand-900/80 mb-5 leading-relaxed">
              HotelOS has transformed the way we manage our property. From
              check-in to checkout, everything is now streamlined and
              transparent. Our staff is happier, our operations are smoother,
              and our guests feel the difference.
            </p>
            <div className="flex items-center gap-3">
              <span className="bg-brand-900 font-display flex h-11 w-11 items-center justify-center rounded-full text-lg font-semibold text-white">
                R
              </span>
              <div>
                <p className="text-brand-900 text-sm font-medium">
                  Rohan Kapoor
                </p>
                <p className="text-xs text-gray-500">
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
