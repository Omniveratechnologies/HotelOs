import { NavLink } from "react-router";
import {
  LayoutGrid,
  Building2,
  Wallet,
  CalendarClock,
  Settings,
  LifeBuoy,
  LogOut,
  Hotel,
  BadgeCheck,
  Cable,
} from "lucide-react";
import { getStoredUser } from "@hotelos/api";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Overview", icon: LayoutGrid },
  { to: "/hotels", label: "Hotels", icon: Building2 },
  { to: "/transactions", label: "Food Transactions", icon: Wallet },
  { to: "/subscriptions", label: "Subscriptions", icon: CalendarClock },
  { to: "/service-requests", label: "Service Requests", icon: LifeBuoy },
  { to: "/channel-approvals", label: "Channel Requests", icon: BadgeCheck },
  { to: "/channel-manager", label: "Channel Manager", icon: Cable },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ onLogoutClick, mobileOpen, onCloseMobile }) {
  const user = getStoredUser();

  const currentAdmin = user || {
    name: "Super Admin",
    role: "SUPER_ADMIN",
  };

  const initials = currentAdmin.name
    ? currentAdmin.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "SA";

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="bg-brand-950/50 fixed inset-0 z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`bg-brand-950 fixed inset-y-0 left-0 z-40 flex w-64 flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-6 py-6">
          <div className="bg-primary-500 text-brand-950 flex h-9 w-9 items-center justify-center rounded-lg">
            <Hotel size={18} strokeWidth={2.25} />
          </div>

          <div>
            <p className="font-display text-sm leading-tight font-bold text-white">
              HotelOS
            </p>

            <p className="text-[11px] font-medium tracking-wider text-white/40 uppercase">
              Super Admin
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white/90"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    strokeWidth={2.25}
                    className={
                      isActive
                        ? "text-primary-400"
                        : "text-white/40 group-hover:text-white/70"
                    }
                  />

                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logged-in Admin */}
        <div className="border-t border-white/10 px-3 py-4">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {currentAdmin.name}
              </p>

              <p className="truncate text-xs text-white/40">
                {currentAdmin.role}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogoutClick}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/55 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut size={17} strokeWidth={2.25} />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
