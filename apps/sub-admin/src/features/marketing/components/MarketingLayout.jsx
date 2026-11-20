import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";

import SiteFooter from "./SiteFooter.jsx";
import SiteHeader from "./SiteHeader.jsx";

/**
 * Shared frame for the marketing pages: header, page content, footer.
 * Use it as a layout route so every child page gets the same header/footer.
 */
export default function MarketingLayout() {
  const { pathname, hash } = useLocation();

  // /#section links scroll to that section, any other page change scrolls to the top.
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);

  return (
    <div className="text-brand-900 flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
