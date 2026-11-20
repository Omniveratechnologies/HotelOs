import { useState } from "react";
import { Link } from "react-router";

import BrandLogo from "./BrandLogo.jsx";
import { Icon } from "./MarketingIcons.jsx";
import { FOOTER } from "../data/siteContent.js";

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-brand-700/80 hover:text-brand-900 text-sm transition-colors"
    >
      {children}
    </Link>
  );
}

export default function SiteFooter() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (event) => {
    event.preventDefault();
    // TODO: connect to the newsletter subscription API when it exists.
  };

  return (
    <footer className="border-surface-200 border-t bg-white">
      <div className="mx-auto max-w-[1400px] px-6 pt-12 pb-6 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr_1.4fr]">
          {/* Brand */}
          <div>
            <BrandLogo />
            <p className="text-brand-700/80 mt-4 max-w-[14rem] text-sm leading-relaxed">
              {FOOTER.tagline}
            </p>
          </div>

          {/* Link columns */}
          {FOOTER.columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-brand-900 text-sm font-bold">
                {column.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink to={link.to}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter + social */}
          <div>
            <h3 className="text-brand-900 text-sm font-bold">
              {FOOTER.newsletterTitle}
            </h3>

            <form
              onSubmit={handleSubscribe}
              className="mt-4 flex items-center gap-2"
            >
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                className="border-surface-300 text-brand-900 placeholder:text-brand-700/50 focus:border-brand-700 h-11 min-w-0 flex-1 rounded-lg border bg-white px-4 text-sm focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="bg-brand-900 hover:bg-brand-800 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white transition-colors"
              >
                <Icon name="arrowRight" className="h-5 w-5" />
              </button>
            </form>

            <div className="mt-5 flex items-center gap-5">
              {FOOTER.social.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className="text-brand-900 hover:text-primary-600 transition-colors"
                >
                  <Icon name={item.icon} className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-surface-200 text-brand-700/70 mt-10 flex flex-col gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} HotelOS. All rights reserved.</p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {FOOTER.legal.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="hover:text-brand-900 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
