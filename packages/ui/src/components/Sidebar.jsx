import { NavLink, useLocation } from "react-router";
import { cn } from "@hotelos/utils";
import { useEffect, useRef, useState } from "react";
import { useSidebarStore } from "@hotelos/stores";

/**
 * @typedef {Object} SidebarItem
 * @property {string} label - Menu item label (also the fallback `key`).
 * @property {string} [path] - Route path rendered by `NavLink`.
 * @property {string} [url] - Alias for `path` (template compat).
 * @property {import("react").ReactNode} [icon] - Leading icon node.
 * @property {string | number} [badge] - Optional count rendered as a pill.
 * @property {boolean} [end] - Match the path exactly (defaults to `true` for
 *   `path === "/"`).
 * @property {string | number} [id] - Stable `key` override.
 * @property {() => void} [onClick] - Called before navigating.
 * @property {boolean} [hr] - Render a divider below the item.
 * @property {SidebarItem[]} [subMenu] - Nested items in an expandable group.
 * @property {boolean} [defaultOpen] - Start the `subMenu` group expanded
 *   (uncontrolled; the checkbox keeps its own state afterwards).
 */

/**
 * @typedef {Object} SidebarBrand
 * @property {string} [title] - Product name shown beside the logo. Defaults
 *   to "HotelOS".
 * @property {string} [subtitle] - Optional second line (e.g. hotel name).
 */

/**
 * @typedef {Object} SidebarUser
 * @property {string} [name] - Display name; initials are derived from it.
 * @property {string} [role] - Optional role text shown under the name.
 */

const DEFAULT_ITEMS = [];

/**
 * Responsive, in-flow sidebar wired to the HotelOS light theme.
 *
 * @param {Object} props
 * @param {SidebarItem[]} props.items - Navigation items.
 * @param {SidebarBrand} [props.brand] - Brand identity.
 * @param {import("react").ReactNode} [props.header] - Optional slot rendered
 *   below the brand (e.g. a stats strip).
 * @param {SidebarUser} [props.user] - Current user shown in the footer.
 * @param {() => void} [props.onLogout] - Logout handler; renders a footer
 *   logout button when provided.
 * @param {boolean} [props.logoutLoading=false] - Shows a spinner on the
 *   logout button while `true`.
 * @param {boolean} [props.isOpen=false] - Sidebar open state (controls both mobile drawer and desktop collapse).
 * @param {() => void} [props.onClose] - Called when the mobile drawer should
 *   close (backdrop click, `Escape`, or navigating).
 * @param {string} [props.className=""] - Extra classes for the `<aside>`.
 * @returns {import("react").ReactElement}
 */
export function Sidebar({
  items = DEFAULT_ITEMS,
  brand,
  header,
  user,
  onLogout,
  logoutLoading = false,
  isOpen = false,
  onClose,
  className = "",
}) {
  const [expandedMenuKey, setExpandedMenuKey] = useState(null);
  const activeExpandedKey = isOpen ? expandedMenuKey : null;

  // Close mobile drawer when resizing to mobile, and restore desktop preference when resizing back
  useEffect(() => {
    let wasDesktop = window.innerWidth >= 1024;
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (wasDesktop && !isDesktop) {
        onClose?.();
      } else if (!wasDesktop && isDesktop) {
        try {
          const stored = localStorage.getItem("hotelos:sidebar_open");
          const shouldBeOpen = stored === null ? true : stored === "true";
          if (shouldBeOpen) {
            useSidebarStore.getState().openSidebar();
          } else {
            useSidebarStore.getState().closeSidebar();
          }
        } catch {
          // ignore
        }
      }
      wasDesktop = isDesktop;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onClose]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleNavigate = () => {
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  };

  const displayName = user?.name || "User";
  const role = user?.role || "";
  const initials = getInitials(displayName);

  const logoutButton = onLogout && (
    <button
      type="button"
      onClick={onLogout}
      disabled={logoutLoading}
      title="Log out"
      aria-label="Log out"
      className="text-brand-900/50 hover:text-brand-900 group p-1.5 transition-all duration-150 ease-out active:scale-95 disabled:opacity-60"
    >
      {logoutLoading ? (
        <SpinnerIcon />
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 transition-colors duration-150 group-hover:text-rose-500"
        >
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
      )}
    </button>
  );

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-md transition-opacity duration-300 ease-in-out lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose?.();
          }
        }}
        className={cn(
          "pointer-events-none fixed inset-y-0 left-0 z-50 flex h-full w-full justify-start transition-[width,transform] duration-300 ease-in-out lg:pointer-events-auto lg:sticky lg:top-0 lg:z-10 lg:block lg:h-screen lg:shrink-0",
          isOpen ? "translate-x-0 lg:w-56" : "-translate-x-full lg:w-16",
          "lg:translate-x-0",
          className,
        )}
      >
        <div className="bg-surface-50 lg:border-surface-200 pointer-events-auto relative flex h-full w-11/12 max-w-md flex-col overflow-hidden rounded-r-2xl shadow-2xl transition-[width] duration-300 ease-in-out lg:h-full lg:w-full lg:max-w-none lg:overflow-visible lg:rounded-none lg:border-r lg:shadow-none">
          {/* Close row (mobile) */}
          <div className="border-surface-100 flex h-14 items-center border-b px-4 lg:hidden">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-brand-900 flex cursor-pointer items-center gap-1 text-sm font-bold transition-all duration-150 hover:opacity-80 active:scale-95"
            >
              <span className="text-2xl leading-none">&times;</span> Close
            </button>
          </div>

          {/* Brand */}
          <div
            className={cn(
              "bg-surface-50 border-surface-100 relative flex items-center border-b py-4 transition-all duration-300 ease-in-out",
              isOpen
                ? "gap-3 px-4"
                : "lg:justify-center lg:gap-0 lg:border-b-0 lg:px-0",
            )}
          >
            <div className="bg-primary-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-200 hover:scale-105">
              <svg viewBox="0 0 24 24" fill="white" className="size-5">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>

            <div
              className={cn(
                "min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                !isOpen
                  ? "lg:pointer-events-none lg:hidden lg:max-w-0 lg:opacity-0"
                  : "lg:max-w-[140px] lg:opacity-100",
              )}
            >
              <div className="font-display text-brand-900 truncate text-sm font-bold tracking-wide">
                {brand?.title ?? "HotelOS"}
              </div>
              {brand?.subtitle && (
                <div className="text-brand-700/60 truncate text-xs">
                  {brand.subtitle}
                </div>
              )}
            </div>
          </div>

          {/* Optional slot (e.g. stats strip) */}
          {header && (
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                !isOpen
                  ? "lg:pointer-events-none lg:max-h-0 lg:opacity-0"
                  : "shrink-0 lg:max-h-40 lg:opacity-100",
              )}
            >
              {header}
            </div>
          )}

          {/* Nav */}
          <nav
            aria-label="Primary"
            className={cn(
              "scrollbar-thin flex-1 overflow-y-auto px-3 py-4 transition-[padding] duration-300 ease-in-out",
              !isOpen && "lg:px-2",
            )}
          >
            <ul className="space-y-1">
              {items.map((item) => {
                const itemKey = item.id ?? item.label;
                return (
                  <SidebarItem
                    key={itemKey}
                    item={item}
                    isOpen={isOpen}
                    isExpanded={activeExpandedKey === itemKey}
                    onToggleExpand={() => {
                      setExpandedMenuKey((prev) =>
                        prev === itemKey ? null : itemKey,
                      );
                    }}
                    onNavigate={handleNavigate}
                  />
                );
              })}
            </ul>
          </nav>

          {/* Bottom bar */}
          <div className="border-surface-200 shrink-0 border-t transition-all duration-300 ease-in-out">
            {/* Collapsed controls (desktop) */}
            <div
              className={cn(
                "transition-all duration-300 ease-in-out",
                !isOpen
                  ? "hidden items-center justify-center gap-0.5 py-2 opacity-100 lg:flex"
                  : "pointer-events-none hidden opacity-0",
              )}
            >
              {logoutButton}
            </div>

            {/* User row */}
            <div
              className={cn(
                "flex items-center justify-between gap-3 overflow-hidden px-4 py-3 transition-all duration-300 ease-in-out",
                !isOpen
                  ? "lg:pointer-events-none lg:max-h-0 lg:py-0 lg:opacity-0"
                  : "lg:max-h-16 lg:opacity-100",
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="bg-brand-900 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-transform duration-200 group-hover:scale-105">
                  {initials}
                </span>
                <div
                  className={cn(
                    "min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                    !isOpen
                      ? "lg:max-w-0 lg:opacity-0"
                      : "lg:max-w-[120px] lg:opacity-100",
                  )}
                >
                  <div className="text-brand-900 truncate text-sm font-medium">
                    {displayName}
                  </div>
                  {role && (
                    <div className="text-brand-700/60 truncate text-[11px] capitalize">
                      {role
                        .split("_")
                        .map(
                          (word) =>
                            word[0].toUpperCase() + word.slice(1).toLowerCase(),
                        )
                        .join(" ")}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                {logoutButton}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/**
 * Single sidebar item. Renders either a flat `NavLink`/button or, when
 * `item.subMenu` is present, an expandable group toggled by a hidden
 * checkbox (`peer`). When `collapsed`, labels are hidden (`lg:hidden`) and
 * the label appears as a floating tooltip on hover.
 *
 * @param {Object} props
 * @param {SidebarItem} props.item - The menu item to render.
 * @param {boolean} props.isOpen - Whether the sidebar is open.
 * @param {() => void} [props.onNavigate] - Called before navigating (used to
 *   close the mobile drawer).
 * @returns {import("react").ReactElement}
 */
export function SidebarItem({
  item,
  isOpen,
  isExpanded = false,
  onToggleExpand,
  onNavigate,
}) {
  const location = useLocation();
  const to = item.path ?? item.url;
  const end = item.end ?? to === "/";

  const liRef = useRef(null);
  const leaveTimerRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({
    top: 0,
    centerTop: 0,
    left: 0,
  });

  const isChildActive = Boolean(
    item.subMenu?.some((sub) => {
      const subTo = sub.path ?? sub.url;
      if (!subTo) return false;
      return sub.end
        ? location.pathname === subTo
        : location.pathname === subTo ||
            location.pathname.startsWith(`${subTo}/`);
    }),
  );

  const aggregatedBadge =
    item.badge != null
      ? item.badge
      : item.subMenu?.reduce((sum, sub) => {
          if (sub.badge == null) return sum;
          const num =
            typeof sub.badge === "number" ? sub.badge : parseInt(sub.badge, 10);
          return !isNaN(num) ? sum + num : sum;
        }, 0) || undefined;

  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isCollapsed = Boolean(!isOpen && isDesktop);

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (liRef.current) {
      const rect = liRef.current.getBoundingClientRect();
      const flyoutEstimatedHeight = item.subMenu?.length
        ? 44 + item.subMenu.length * 36
        : 36;
      const top = Math.max(
        8,
        Math.min(rect.top, window.innerHeight - flyoutEstimatedHeight - 16),
      );
      setTooltipPos({
        top,
        centerTop: rect.top + rect.height / 2,
        left: rect.right + 8,
      });
    }
    setHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimerRef.current = setTimeout(() => {
      setHovered(false);
    }, 160);
  };

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
      }
    };
  }, []);

  const handleItemNavigate = () => {
    setHovered(false);
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    onNavigate?.();
  };

  const itemClassName = ({ isActive }) =>
    cn(
      "group relative flex w-full items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ease-out",
      isOpen ? "gap-3 px-3" : "px-3 gap-3 lg:justify-center lg:gap-0 lg:px-0",
      isActive
        ? "bg-brand-900 text-white shadow-sm"
        : "text-brand-700 hover:bg-background-100 hover:text-brand-900 active:scale-[0.98]",
    );

  return (
    <li
      ref={liRef}
      className="group relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {item.subMenu?.length ? (
        <>
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={(e) => {
              if (isCollapsed) {
                e.preventDefault();
                setHovered((prev) => !prev);
              } else {
                onToggleExpand?.();
              }
            }}
            className={cn(
              "relative flex w-full cursor-pointer items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ease-out",
              isOpen
                ? "gap-3 px-3"
                : "gap-3 px-3 lg:justify-center lg:gap-0 lg:px-0",
              isCollapsed && isChildActive
                ? "bg-brand-900 text-white shadow-sm"
                : "text-brand-700 hover:bg-background-100 hover:text-brand-900 active:scale-[0.98]",
            )}
          >
            {/* Child 1: Icon centered in uniform 20x20 box */}
            <span className="flex h-5 w-5 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105">
              {item.icon}
            </span>

            {/* Child 2: Expanded content container (label, chevron, text badge) */}
            <div
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                !isOpen
                  ? "lg:pointer-events-none lg:hidden lg:max-w-0 lg:opacity-0"
                  : "lg:max-w-[160px] lg:opacity-100",
              )}
            >
              <span className="block min-w-0 flex-1 truncate text-left">
                {item.label}
              </span>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  isExpanded && "rotate-180",
                )}
              >
                <path d="M9 18l6-6-6-6" />
              </svg>

              {aggregatedBadge != null ? (
                <span className="text-primary-700 bg-primary-400/15 ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold">
                  {aggregatedBadge}
                </span>
              ) : null}
            </div>

            {/* Absolute notification dot when collapsed */}
            {aggregatedBadge != null ? (
              <span
                className={cn(
                  "bg-primary-400 absolute top-2 right-2 h-2 w-2 rounded-full transition-opacity duration-300 ease-in-out",
                  !isOpen
                    ? "hidden opacity-100 lg:block"
                    : "pointer-events-none opacity-0",
                )}
              />
            ) : null}
          </button>

          <div
            className={cn(
              "grid overflow-hidden transition-all duration-300 ease-in-out",
              isExpanded && !isCollapsed
                ? "mt-1 grid-rows-[1fr] opacity-100"
                : "pointer-events-none mt-0 grid-rows-[0fr] opacity-0",
              !isOpen && "lg:hidden",
            )}
          >
            <div className="overflow-hidden">
              <ul className="border-surface-200 ml-5 space-y-1 border-l py-1 pl-3">
                {item.subMenu.map((sub, index) => {
                  const subTo = sub.path ?? sub.url;

                  return (
                    <li key={sub.id ?? sub.label ?? index}>
                      <NavLink
                        to={subTo}
                        end={sub.end}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(
                            "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ease-out",
                            isActive
                              ? "bg-brand-900 text-white shadow-sm"
                              : "text-brand-700 hover:bg-background-100 hover:text-brand-900 active:scale-[0.98]",
                          )
                        }
                      >
                        {sub.icon && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                            {sub.icon}
                          </span>
                        )}
                        <span className="block min-w-0 flex-1 truncate text-left">
                          {sub.label}
                        </span>
                        {sub.badge != null && (
                          <span className="text-primary-700 bg-primary-400/15 ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold">
                            {sub.badge}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Desktop Collapsed Submenu Flyout */}
          {isCollapsed && hovered && (
            <div
              role="menu"
              aria-label={item.label}
              onMouseEnter={() => {
                if (leaveTimerRef.current) {
                  clearTimeout(leaveTimerRef.current);
                  leaveTimerRef.current = null;
                }
                setHovered(true);
              }}
              onMouseLeave={handleMouseLeave}
              className={cn(
                "border-surface-200 bg-surface-50 fixed z-9999 hidden min-w-48 rounded-xl border p-1.5 shadow-2xl backdrop-blur-md transition-all duration-150 ease-out lg:block",
                "animate-in fade-in-0 zoom-in-95 duration-150",
                "before:absolute before:top-0 before:bottom-0 before:-left-3 before:w-3 before:content-['']",
              )}
              style={{ top: tooltipPos.top, left: tooltipPos.left }}
            >
              <div className="border-surface-200/80 border-b px-3 py-2 text-left">
                <div className="text-brand-900 font-display text-xs font-bold tracking-wide">
                  {item.label}
                </div>
              </div>
              <ul className="mt-1 space-y-0.5">
                {item.subMenu.map((sub, index) => {
                  const subTo = sub.path ?? sub.url;
                  return (
                    <li key={sub.id ?? sub.label ?? index}>
                      <NavLink
                        to={subTo}
                        end={sub.end}
                        onClick={handleItemNavigate}
                        className={({ isActive }) =>
                          cn(
                            "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150 ease-out active:scale-[0.98]",
                            isActive
                              ? "bg-brand-900 text-white shadow-sm"
                              : "text-brand-700 hover:bg-background-100 hover:text-brand-900",
                          )
                        }
                      >
                        {sub.icon && (
                          <span className="flex shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                            {sub.icon}
                          </span>
                        )}
                        <span className="flex-1 truncate text-left">
                          {sub.label}
                        </span>
                        {sub.badge != null && (
                          <span className="bg-primary-400/20 text-primary-700 ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                            {sub.badge}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      ) : (
        <>
          {to ? (
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={itemClassName}
            >
              {/* Child 1: Icon centered in uniform 20x20 box */}
              <span className="flex h-5 w-5 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                {item.icon}
              </span>

              {/* Child 2: Expanded content container (label, text badge) */}
              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                  !isOpen
                    ? "lg:pointer-events-none lg:hidden lg:max-w-0 lg:opacity-0"
                    : "lg:max-w-[160px] lg:opacity-100",
                )}
              >
                <span className="block min-w-0 flex-1 truncate text-left">
                  {item.label}
                </span>

                {item.badge != null ? (
                  <span className="text-primary-700 bg-primary-400/15 ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </div>

              {/* Absolute notification dot when collapsed */}
              {item.badge != null ? (
                <span
                  className={cn(
                    "bg-primary-400 absolute top-2 right-2 h-2 w-2 rounded-full transition-opacity duration-300 ease-in-out",
                    !isOpen
                      ? "hidden opacity-100 lg:block"
                      : "pointer-events-none opacity-0",
                  )}
                />
              ) : null}
            </NavLink>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                onNavigate?.();
                item.onClick?.(e);
              }}
              className={itemClassName({ isActive: false })}
            >
              {/* Child 1: Icon centered in uniform 20x20 box */}
              <span className="flex h-5 w-5 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                {item.icon}
              </span>

              {/* Child 2: Expanded content container (label, text badge) */}
              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                  !isOpen
                    ? "lg:pointer-events-none lg:hidden lg:max-w-0 lg:opacity-0"
                    : "lg:max-w-[160px] lg:opacity-100",
                )}
              >
                <span className="block min-w-0 flex-1 truncate text-left">
                  {item.label}
                </span>

                {item.badge != null ? (
                  <span className="text-primary-700 bg-primary-400/15 ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </div>

              {/* Absolute notification dot when collapsed */}
              {item.badge != null ? (
                <span
                  className={cn(
                    "bg-primary-400 absolute top-2 right-2 h-2 w-2 rounded-full transition-opacity duration-300 ease-in-out",
                    !isOpen
                      ? "hidden opacity-100 lg:block"
                      : "pointer-events-none opacity-0",
                  )}
                />
              ) : null}
            </button>
          )}

          {/* Desktop Collapsed Clickable Tooltip */}
          {isCollapsed &&
            hovered &&
            (to ? (
              <NavLink
                to={to}
                end={end}
                onClick={handleItemNavigate}
                onMouseEnter={() => {
                  if (leaveTimerRef.current) {
                    clearTimeout(leaveTimerRef.current);
                    leaveTimerRef.current = null;
                  }
                  setHovered(true);
                }}
                onMouseLeave={handleMouseLeave}
                className={({ isActive }) =>
                  cn(
                    "fixed z-9999 hidden -translate-y-1/2 cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shadow-xl transition-all duration-150 ease-out active:scale-95 lg:flex",
                    "animate-in fade-in-0 zoom-in-95 duration-150",
                    "before:absolute before:top-0 before:bottom-0 before:-left-3 before:w-3 before:content-['']",
                    isActive
                      ? "bg-brand-900 text-white ring-1 ring-white/20"
                      : "bg-brand-900 hover:bg-brand-800 text-white hover:shadow-2xl",
                  )
                }
                style={{ top: tooltipPos.centerTop, left: tooltipPos.left }}
              >
                <span>{item.label}</span>
                {item.badge != null && (
                  <span className="bg-primary-400/25 text-primary-200 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  handleItemNavigate(e);
                  item.onClick?.();
                }}
                onMouseEnter={() => {
                  if (leaveTimerRef.current) {
                    clearTimeout(leaveTimerRef.current);
                    leaveTimerRef.current = null;
                  }
                  setHovered(true);
                }}
                onMouseLeave={handleMouseLeave}
                className={cn(
                  "bg-brand-900 hover:bg-brand-800 fixed z-9999 hidden -translate-y-1/2 cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-xl transition-all duration-150 ease-out hover:shadow-2xl active:scale-95 lg:flex",
                  "animate-in fade-in-0 zoom-in-95 duration-150",
                  "before:absolute before:top-0 before:bottom-0 before:-left-3 before:w-3 before:content-['']",
                )}
                style={{ top: tooltipPos.centerTop, left: tooltipPos.left }}
              >
                <span>{item.label}</span>
                {item.badge != null && (
                  <span className="bg-primary-400/25 text-primary-200 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
        </>
      )}

      {!item.subMenu?.length && item.hr && (
        <hr className="border-surface-100 my-2" />
      )}
    </li>
  );
}

function getInitials(name) {
  return (name || "U").trim()[0]?.toUpperCase() || "U";
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M4 12a8 8 0 018-8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Mobile hamburger button that opens the sidebar drawer.
 * @param {Object} props
 * @param {string} [props.label="Open menu"] - Accessible label for the button (`aria-label`).
 */
export function SidebarToggle({ label = "Open menu" }) {
  const toggleSidebar = useSidebarStore((s) => s.toggleSidebar);

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={label}
      className="text-brand-900 cursor-pointer rounded-lg p-1.5 transition-all duration-150 ease-out hover:bg-black/5 active:scale-95"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
