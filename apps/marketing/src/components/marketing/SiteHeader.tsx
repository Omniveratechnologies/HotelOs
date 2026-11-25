"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ArrowRight, ChevronDown, ChevronUp, Menu, X } from "lucide-react";

import BrandLogo from "../ui/BrandLogo";
import LoginModal from "../ui/LoginModal";
import SolutionsMenu from "./SolutionsMenu";
import {
  MOBILE_SOLUTION_LINKS,
  NAV_ITEMS,
  ROUTES,
  SITE_IMAGES,
} from "@/data/siteContent";
import type { NavItem } from "@/types/marketing";

const navItemClass =
  "group relative flex h-11 items-center gap-1.5 rounded-lg px-4 text-[15px] font-medium text-brand-900 transition-colors";

const SOLUTION_PATHS = new Set<string>(
  MOBILE_SOLUTION_LINKS.map((link) => link.to),
);

const cleanPath = (pathname: string) =>
  pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

function isItemActive(item: NavItem, pathname: string) {
  if (item.menu === "solutions") return SOLUTION_PATHS.has(pathname);
  return (
    Boolean(item.href) &&
    item.href!.startsWith("/") &&
    !item.href!.includes("#") &&
    item.href === pathname
  );
}

function NavUnderline({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-4 bottom-1.5 h-0.5 origin-left rounded-full bg-[#d4a02f] transition-transform duration-300 ease-out motion-reduce:transition-none ${
        active ? "scale-x-100" : "scale-x-0 opacity-60 group-hover:scale-x-100"
      }`}
    />
  );
}

export default function SiteHeader({
  images = SITE_IMAGES,
}: {
  images?: Record<string, string>;
}) {
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const currentPathname = usePathname();
  const pathname = cleanPath(currentPathname || "/");

  const closeAll = () => {
    setSolutionsOpen(false);
    setMobileOpen(false);
  };

  useEffect(() => {
    if (!solutionsOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setSolutionsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSolutionsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [solutionsOpen]);

  return (
    <>
      <header
        ref={headerRef}
        className="border-surface-200 sticky top-0 z-40 border-b bg-white"
      >
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between gap-6 px-6 lg:px-10">
          <BrandLogo onClick={closeAll} />

          {/* Desktop navigation */}
          <nav
            aria-label="Main"
            className="hidden items-center gap-2 lg:flex xl:gap-4"
          >
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item, pathname);

              return item.menu === "solutions" ? (
                <div key={item.label} className="relative">
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={solutionsOpen}
                    aria-current={active ? "true" : undefined}
                    onClick={() => setSolutionsOpen((open) => !open)}
                    className={`${navItemClass} ${
                      solutionsOpen ? "bg-[#fbefdc]" : "hover:bg-background-100"
                    }`}
                  >
                    {item.label}
                    {solutionsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <NavUnderline active={active} />
                  </button>
                  {solutionsOpen && (
                    <span
                      aria-hidden="true"
                      className="absolute top-[calc(100%+0.625rem)] left-1/2 h-2 w-4 -translate-x-1/2 bg-[#fbefdc] [clip-path:polygon(50%_0,0_100%,100%_100%)]"
                    />
                  )}
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href || "#"}
                  onClick={closeAll}
                  aria-current={active ? "page" : undefined}
                  className={`${navItemClass} hover:bg-background-100`}
                >
                  {item.label}
                  {item.hasMenu && <ChevronDown className="h-4 w-4" />}
                  <NavUnderline active={active} />
                </Link>
              );
            })}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href={ROUTES.requestDemo}
              onClick={closeAll}
              className="border-brand-900 text-brand-900 hover:bg-brand-50 rounded-lg border px-6 py-2.5 text-[15px] font-semibold transition-colors"
            >
              Request Demo
            </Link>
            <button
              type="button"
              onClick={() => {
                closeAll();
                setLoginModalOpen(true);
              }}
              className="bg-brand-900 hover:bg-brand-800 inline-flex cursor-pointer items-center gap-2 rounded-lg px-6 py-2.5 text-[15px] font-semibold text-white transition-colors"
            >
              Login
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => {
              setSolutionsOpen(false);
              setMobileOpen((open) => !open);
            }}
            className="text-brand-900 hover:bg-background-100 flex h-11 w-11 items-center justify-center rounded-lg transition-colors lg:hidden"
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Solutions mega menu (desktop) */}
        {solutionsOpen && (
          <div className="absolute top-full left-1/2 hidden w-[min(75rem,calc(100vw-2rem))] -translate-x-1/2 pt-1 lg:block">
            <SolutionsMenu images={images} onNavigate={closeAll} />
          </div>
        )}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-surface-200 max-h-[calc(100vh-5rem)] overflow-y-auto border-t bg-white px-6 pt-3 pb-6 lg:hidden">
            <nav aria-label="Mobile" className="-mx-3 flex flex-col">
              {NAV_ITEMS.map((item) => {
                const active = isItemActive(item, pathname);
                const rowClass = `rounded-lg px-3 py-3 text-base text-brand-900 ${
                  active ? "bg-[#fbf3e4] font-semibold" : "font-medium"
                }`;

                return item.menu === "solutions" ? (
                  <div key={item.label}>
                    <button
                      type="button"
                      aria-expanded={mobileSolutionsOpen}
                      aria-current={active ? "true" : undefined}
                      onClick={() => setMobileSolutionsOpen((open) => !open)}
                      className={`flex w-full items-center justify-between ${rowClass}`}
                    >
                      {item.label}
                      {mobileSolutionsOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {mobileSolutionsOpen && (
                      <ul className="border-surface-200 mb-2 ml-6 flex flex-col border-l pl-4">
                        {MOBILE_SOLUTION_LINKS.map((link) => {
                          const linkActive = link.to === pathname;

                          return (
                            <li key={link.label}>
                              <Link
                                href={link.to}
                                onClick={closeAll}
                                aria-current={linkActive ? "page" : undefined}
                                className={`block py-2 text-[15px] ${
                                  linkActive
                                    ? "font-semibold text-[#a8761f]"
                                    : "text-brand-700"
                                }`}
                              >
                                {link.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href || "#"}
                    onClick={closeAll}
                    aria-current={active ? "page" : undefined}
                    className={rowClass}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 flex gap-3">
              <Link
                href={ROUTES.requestDemo}
                onClick={closeAll}
                className="border-brand-900 text-brand-900 flex-1 rounded-lg border px-4 py-2.5 text-center text-[15px] font-semibold"
              >
                Request Demo
              </Link>
              <button
                type="button"
                onClick={() => {
                  closeAll();
                  setLoginModalOpen(true);
                }}
                className="bg-brand-900 inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[15px] font-semibold text-white"
              >
                Login
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Role Selection Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </>
  );
}
