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
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr] gap-10 pb-12 border-b border-cream/10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-9 h-9 rounded-full bg-cream/10 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 21V9l8-5 8 5v12" stroke="#F4F4E4" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M9 21v-6h6v6" stroke="#766242" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="font-display text-xl font-semibold text-cream">
                Hotel<span className="text-gold">OS</span>
              </span>
            </div>
            <p className="text-cream/50 text-sm leading-relaxed max-w-xs">
              The Intelligent Operating System for Modern Hotels.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-cream text-sm font-medium mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-cream/50 text-sm hover:text-gold transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-cream text-sm font-medium mb-4">Newsletter</p>
            <p className="text-cream/50 text-sm mb-4">Stay updated with HotelOS news and insights.</p>
            <form className="flex" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-cream/10 text-cream placeholder:text-cream/40 text-sm rounded-l-full px-4 py-2.5 outline-none border border-cream/10"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="bg-gold rounded-r-full px-4 flex items-center justify-center hover:bg-gold-hover transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="#F4F4E4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cream/40">
          <p>© 2026 HotelOS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gold transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gold transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gold transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
