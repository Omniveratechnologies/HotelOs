import { useEffect, useState } from "react";
import { FiChevronLeft, FiX } from "react-icons/fi";
import { GiChefToque } from "react-icons/gi";
import { useLocation } from "react-router-dom";
import SideBarMenu from "./SideBarMenu";

let desktopSidebarCollapsed = false;

const Sidebar = ({ isMenuOpen, setIsMenuOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(desktopSidebarCollapsed);
  const location = useLocation();

  useEffect(() => {
    const syncWithViewport = () => {
      if (window.innerWidth >= 1024) {
        setIsMenuOpen(true);
      } else {
        setIsMenuOpen(false);
      }
    };

    syncWithViewport();
    window.addEventListener("resize", syncWithViewport);
    return () => window.removeEventListener("resize", syncWithViewport);
  }, [setIsMenuOpen]);

  useEffect(() => {
    if (window.innerWidth < 1024) setIsMenuOpen(false);
  }, [location.pathname, setIsMenuOpen]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isCollapsed ? "5rem" : "16rem",
    );
  }, [isCollapsed]);

  useEffect(() => {
    const toggleCollapsed = () => {
      if (window.innerWidth < 1024) {
        setIsMenuOpen((current) => !current);
        return;
      }
      setIsCollapsed((current) => {
        const next = !current;
        desktopSidebarCollapsed = next;
        setIsMenuOpen(!next);
        return next;
      });
    };

    window.addEventListener("kitchen-toggle-sidebar", toggleCollapsed);
    return () =>
      window.removeEventListener("kitchen-toggle-sidebar", toggleCollapsed);
  }, [setIsMenuOpen]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [setIsMenuOpen]);

  return (
    <>
      {isMenuOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      <aside
        aria-label="Kitchen sidebar"
        data-collapsed={isCollapsed}
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-black text-white shadow-xl transition-[transform,width] duration-300 ease-in-out lg:translate-x-0 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-gray-800 px-4 lg:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg">
            <GiChefToque size={24} />
          </div>

          <div className={isCollapsed ? "lg:hidden" : ""}>
            <h1 className="text-lg font-bold">FoodHub</h1>
            <p className="text-xs text-gray-400">Kitchen Management</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.innerWidth < 1024) {
              setIsMenuOpen(false);
              return;
            }
            setIsCollapsed((current) => {
              const next = !current;
              desktopSidebarCollapsed = next;
              setIsMenuOpen(!next);
              return next;
            });
          }}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-800 text-gray-300 transition hover:text-white"
        >
          <span className="hidden lg:block">
            <FiChevronLeft
              size={18}
              className={isCollapsed ? "rotate-180" : ""}
            />
          </span>
          <span className="lg:hidden">
            <FiX size={18} />
          </span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SideBarMenu isCollapsed={isCollapsed} />
      </div>
      </aside>
    </>
  );
};

export default Sidebar;