const columns = [
  {
    title: "Product",
    links: ["Overview", "Features", "Security", "Integrations"],
  },
  {
    title: "Solutions",
    links: ["Hotels", "Resorts", "Boutique Stays", "Hotel Groups"],
  },
  {
    title: "Resources",
    links: ["Documentation", "Blog", "Webinars", "Support"],
  },
  {
    title: "Company",
    links: ["About Us", "Careers", "Partners", "Contact Us"],
  },
];

export default function Footer() {
  return (
    <footer id="about" className="bg-navy pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="border-cream/10 grid gap-10 border-b pb-12 md:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="bg-cream/10 flex h-9 w-9 items-center justify-center rounded-full">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 21V9l8-5 8 5v12"
                    stroke="#F4F4E4"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 21v-6h6v6"
                    stroke="#766242"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="font-display text-cream text-xl font-semibold">
                Hotel<span className="text-gold">OS</span>
              </span>
            </div>
            <p className="text-cream/50 max-w-xs text-sm leading-relaxed">
              The Intelligent Operating System for Modern Hotels.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-cream mb-4 text-sm font-medium">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-cream/50 hover:text-gold text-sm transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-cream mb-4 text-sm font-medium">Newsletter</p>
            <p className="text-cream/50 mb-4 text-sm">
              Stay updated with HotelOS news and insights.
            </p>
            <form className="flex" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="border-cream/10 bg-cream/10 text-cream placeholder:text-cream/40 w-full rounded-l-full border px-4 py-2.5 text-sm outline-hidden"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="bg-gold hover:bg-gold-hover flex items-center justify-center rounded-r-full px-4 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="#F4F4E4"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>

        <div className="text-cream/40 flex flex-col items-center justify-between gap-4 pt-6 text-xs sm:flex-row">
          <p>© 2026 HotelOS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gold transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-gold transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-gold transition-colors">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
