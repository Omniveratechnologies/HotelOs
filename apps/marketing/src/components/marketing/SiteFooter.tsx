"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import BrandLogo from "../ui/BrandLogo";
import { Icon } from "../ui/MarketingIcons";
import { FOOTER } from "@/data/siteContent";

const CURRENT_YEAR = new Date().getFullYear();

function FooterLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={to}
      className="text-brand-700/80 hover:text-brand-900 text-sm transition-colors"
    >
      {children}
    </Link>
  );
}

export default function SiteFooter() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (event: React.FormEvent) => {
    event.preventDefault();
    void email;
    // Newsletter integration point
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
                className="bg-brand-900 hover:bg-brand-800 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white transition-colors"
              >
                <ArrowRight className="h-5 w-5" />
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
        <div className="border-surface-200 text-brand-700/70 mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs sm:flex-row">
          <p>© {CURRENT_YEAR} HotelOS Inc. All rights reserved.</p>

          <div className="flex items-center gap-6">
            {FOOTER.legal.map((item) => (
              <FooterLink key={item.label} to={item.to}>
                {item.label}
              </FooterLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
