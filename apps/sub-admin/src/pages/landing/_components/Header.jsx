import { useState } from "react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About Us", href: "#about" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur border-b border-beige-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 shrink-0">
          <span className="w-9 h-9 rounded-full bg-navy flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 21V9l8-5 8 5v12"
                stroke="#F4F4E4"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M9 21v-6h6v6" stroke="#766242" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight text-navy">
            Hotel<span className="text-gold">OS</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[15px] text-navy/80 hover:text-gold transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a
            href="#demo"
            className="text-[15px] font-medium text-navy border border-beige-border rounded-full px-5 py-2.5 hover:border-gold hover:text-gold transition-colors"
          >
            Request Demo
          </a>
          <Link
            to="/login"
            className="text-[15px] font-medium text-cream bg-navy rounded-full px-5 py-2.5 hover:bg-navy-dark transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="#F4F4E4" strokeWidth="1.8" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#F4F4E4" strokeWidth="1.8" />
            </svg>
            Login
          </Link>
        </div>

        <button
          className="lg:hidden text-navy"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="#22324E" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-beige-border bg-cream px-6 py-5 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-navy/80 text-[15px]">
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-2">
            <a
              href="#demo"
              className="text-center text-[15px] font-medium text-navy border border-beige-border rounded-full px-5 py-2.5"
            >
              Request Demo
            </a>
            <Link
              to="/login"
              className="text-center text-[15px] font-medium text-cream bg-navy rounded-full px-5 py-2.5"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
