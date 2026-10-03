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
    <footer id="about" className="bg-brand-900 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 21V9l8-5 8 5v12"
                    stroke="var(--color-surface-50)"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 21v-6h6v6"
                    stroke="var(--color-primary-400)"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="font-display text-xl font-semibold text-white">
                Hotel<span className="text-primary-400">OS</span>
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/50">
              The Intelligent Operating System for Modern Hotels.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-sm font-medium text-white">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="hover:text-primary-400 text-sm text-white/50 transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="mb-4 text-sm font-medium text-white">Newsletter</p>
            <p className="mb-4 text-sm text-white/50">
              Stay updated with HotelOS news and insights.
            </p>
            <form className="flex" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-l-full border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white outline-hidden placeholder:text-white/40"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="bg-primary-400 hover:bg-primary-500 flex items-center justify-center rounded-r-full px-4 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="var(--color-surface-50)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-6 text-xs text-white/40 sm:flex-row">
          <p>© 2026 HotelOS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary-400 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-primary-400 transition-colors">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
