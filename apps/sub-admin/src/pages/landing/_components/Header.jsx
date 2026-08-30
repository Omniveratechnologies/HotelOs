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
    <header className="sticky top-0 z-50 border-b border-beige-border bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <a href="#top" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy">
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
          <span className="font-display text-2xl font-semibold tracking-tight text-navy">
            Hotel<span className="text-gold">OS</span>
          </span>
        </a>

        <nav className="hidden items-center gap-10 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[15px] text-navy/80 transition-colors hover:text-gold"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="#demo"
            className="rounded-full border border-beige-border px-5 py-2.5 text-[15px] font-medium text-navy transition-colors hover:border-gold hover:text-gold"
          >
            Request Demo
          </a>
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-[15px] font-medium text-cream transition-colors hover:bg-navy-dark"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect
                x="5"
                y="11"
                width="14"
                height="9"
                rx="2"
                stroke="#F4F4E4"
                strokeWidth="1.8"
              />
              <path
                d="M8 11V7a4 4 0 0 1 8 0v4"
                stroke="#F4F4E4"
                strokeWidth="1.8"
              />
            </svg>
            Login
          </Link>
        </div>

        <button
          className="text-navy lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="#22324E"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-beige-border bg-cream px-6 py-5 lg:hidden">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[15px] text-navy/80"
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-2">
            <a
              href="#demo"
              className="rounded-full border border-beige-border px-5 py-2.5 text-center text-[15px] font-medium text-navy"
            >
              Request Demo
            </a>
            <Link
              to="/login"
              className="rounded-full bg-navy px-5 py-2.5 text-center text-[15px] font-medium text-cream"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
