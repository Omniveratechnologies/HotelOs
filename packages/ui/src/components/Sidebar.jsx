import { NavLink } from "react-router";
import { cn } from "@hotelos/utils";
import { useEffect, useRef, useState } from "react";

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

const COLLAPSED_KEY = "hotelos:sidebar-collapsed";
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
 * @param {boolean} [props.isOpen=false] - Mobile drawer isOpen state.
 * @param {() => void} [props.onClose] - Called when the mobile drawer should
 *   close (backdrop click, `Escape`, or navigating).
 * @param {boolean} [props.defaultCollapsed=false] - Initial desktop collapse
 *   state when nothing is stored in `localStorage`.
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
  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSED_KEY, isOpen ? "0" : "1");
    } catch {
      // Ignore storage failures (private browsing, etc.)
    }
  }, [isOpen]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(COLLAPSED_KEY);
      if (saved && saved === "1") onClose?.();
    } catch {
      // Ignore storage failures (private browsing, etc.)
    }
  }, [onClose]);

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
      className="text-brand-900/50 hover:text-brand-900 group p-1.5 transition-colors disabled:opacity-60"
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
          className="size-5 group-hover:text-rose-500"
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
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-md transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-full justify-start transition-all duration-300 lg:sticky lg:top-0 lg:z-10 lg:block lg:h-screen lg:shrink-0",
          isOpen ? "translate-x-0 lg:w-16" : "-translate-x-full lg:w-56",
          "lg:translate-x-0",
          className,
        )}
      >
        <div className="bg-surface-50 lg:border-surface-200 relative flex h-full w-11/12 max-w-md flex-col overflow-hidden rounded-r-2xl shadow-2xl lg:h-full lg:w-full lg:max-w-none lg:overflow-visible lg:rounded-none lg:border-r lg:shadow-none">
          {/* Close row (mobile) */}
          <div className="border-surface-100 flex h-14 items-center border-b px-4 lg:hidden">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-brand-900 flex cursor-pointer items-center gap-1 text-sm font-bold"
            >
              <span className="text-2xl leading-none">&times;</span> Close
            </button>
          </div>

          {/* Brand */}
          <div
            className={cn(
              "bg-surface-50 border-surface-100 relative flex items-center gap-3 border-b py-4",
              isOpen ? "lg:justify-center lg:border-b-0 lg:px-0" : "px-4",
            )}
          >
            <div className="bg-primary-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
              <svg viewBox="0 0 24 24" fill="white" className="size-5">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>

            <div className={cn("min-w-0", isOpen ? "lg:hidden" : "")}>
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
            <div className={isOpen ? "lg:hidden" : "shrink-0"}>{header}</div>
          )}

          {/* Nav */}
          <nav
            aria-label="Primary"
            className={cn(
              "scrollbar-thin flex-1 overflow-y-auto px-3 py-4",
              isOpen && "lg:px-2",
            )}
          >
            <ul className="space-y-1">
              {items.map((item) => (
                <SidebarItem
                  key={item.id ?? item.label}
                  item={item}
                  isOpen={isOpen}
                  onNavigate={onClose}
                />
              ))}
            </ul>
          </nav>

          {/* Bottom bar */}
          <div className="border-surface-200 shrink-0 border-t">
            {/* Collapsed controls (desktop) */}
            <div
              className={
                isOpen
                  ? "hidden items-center justify-center gap-0.5 py-2 lg:flex"
                  : "hidden"
              }
            >
              {logoutButton}
            </div>

            {/* User row */}
            <div
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3",
                isOpen ? "lg:hidden" : "",
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="bg-brand-900 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                  {initials}
                </span>
                <div className="min-w-0">
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
export function SidebarItem({ item, isOpen, onNavigate }) {
  const to = item.path ?? item.url;
  const end = item.end ?? to === "/";
  const id = item.label.replace(/\s+/g, "-");

  const liRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const handleMouseEnter = () => {
    if (liRef.current) {
      const rect = liRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top + rect.height / 2,
        left: rect.right + 8,
      });
    }
    setHovered(true);
  };

  const itemClassName = ({ isActive }) =>
    cn(
      "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
      isOpen ? "lg:justify-center lg:px-2" : "",
      isActive
        ? "bg-brand-900 text-white shadow-sm"
        : "text-brand-700 hover:bg-background-100 hover:text-brand-900",
    );

  const label = (
    <span
      className={cn(
        "block min-w-0 flex-1 truncate text-left",
        isOpen && "lg:hidden",
      )}
    >
      {item.label}
    </span>
  );

  return (
    <li
      ref={liRef}
      className="group relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
    >
      {item.subMenu?.length ? (
        <>
          <input className="peer hidden" id={id} type="checkbox" />
          <label
            htmlFor={id}
            className={cn(
              "text-brand-700 hover:bg-background-100 hover:text-brand-900 relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 peer-checked:[&>svg]:rotate-180",
              isOpen ? "lg:justify-center lg:px-2" : "",
            )}
          >
            <span className="flex shrink-0 items-center justify-center">
              {item.icon}
            </span>
            {label}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                isOpen && "lg:hidden",
              )}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </label>

          <div className="invisible relative ml-2 hidden max-h-0 overflow-hidden pl-2 opacity-0 transition-all duration-200 peer-checked:visible peer-checked:mt-1 peer-checked:block peer-checked:max-h-96 peer-checked:opacity-100">
            <ul className="border-surface-200 ml-3 space-y-1 border-l pl-3">
              {item.subMenu.map((sub, index) => {
                const subTo = sub.path ?? sub.url;

                return (
                  <li key={sub.label ?? index}>
                    <NavLink
                      to={subTo}
                      end={sub.end}
                      onClick={onNavigate}
                      className={itemClassName}
                    >
                      {sub.icon}
                      <span className="block min-w-0 flex-1 truncate text-left">
                        {sub.label}
                      </span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : (
        <NavLink
          to={to}
          end={end}
          onClick={onNavigate}
          className={itemClassName}
        >
          <span className="flex shrink-0 items-center justify-center">
            {item.icon}
          </span>
          {label}
          {item.badge != null ? (
            <>
              <span
                className={cn(
                  "text-primary-700 bg-primary-400/15 ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                  isOpen && "lg:hidden",
                )}
              >
                {item.badge}
              </span>
              <span
                className={cn(
                  "bg-primary-400 absolute top-1.5 right-1.5 h-2 w-2 rounded-full",
                  isOpen ? "hidden lg:block" : "hidden",
                )}
              />
            </>
          ) : null}
        </NavLink>
      )}

      {!item.subMenu?.length && item.hr && (
        <hr className="border-surface-100 my-2" />
      )}

      {/* Collapsed hover tooltip */}
      {isOpen && hovered && (
        <span
          className="bg-brand-900 pointer-events-none fixed z-9999 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-lg lg:block"
          style={{ top: tooltipPos.top, left: tooltipPos.left }}
        >
          {item.label}
        </span>
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
