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
    <footer id="about" className="bg-navy pb-8 pt-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-10 border-b border-cream/10 pb-12 md:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/10">
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
              <span className="font-display text-xl font-semibold text-cream">
                Hotel<span className="text-gold">OS</span>
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-cream/50">
              The Intelligent Operating System for Modern Hotels.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-sm font-medium text-cream">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-cream/50 transition-colors hover:text-gold"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="mb-4 text-sm font-medium text-cream">Newsletter</p>
            <p className="mb-4 text-sm text-cream/50">
              Stay updated with HotelOS news and insights.
            </p>
            <form className="flex" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-l-full border border-cream/10 bg-cream/10 px-4 py-2.5 text-sm text-cream outline-none placeholder:text-cream/40"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="flex items-center justify-center rounded-r-full bg-gold px-4 transition-colors hover:bg-gold-hover"
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

        <div className="flex flex-col items-center justify-between gap-4 pt-6 text-xs text-cream/40 sm:flex-row">
          <p>© 2026 HotelOS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="transition-colors hover:text-gold">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-gold">
              Terms of Service
            </a>
            <a href="#" className="transition-colors hover:text-gold">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
