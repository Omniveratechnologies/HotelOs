import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useSubAdmin } from "../app/subAdminContext.js";

const items = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: (
      <path d="M4 13h6V4H4v9zM14 20h6v-9h-6v9zM14 4v5h6V4h-6zM4 20h6v-5H4v5z" />
    ),
  },
  {
    label: "Reservations",
    path: "/reservations",
    icon: (
      <path
        d="M4 5h16v15H4zM4 9h16M8 3v4M16 3v4"
        fill="none"
        strokeLinecap="round"
      />
    ),
  },
  {
    label: "Rooms",
    path: "/rooms",
    icon: (
      <path
        d="M3 21V9l9-6 9 6v12M9 21v-6h6v6"
        fill="none"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Guests",
    path: "/guests",
    icon: (
      <path
        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Housekeeping",
    path: "/housekeeping",
    icon: (
      <path
        d="M4 4l16 16M8 4l12 12M4 8l8 8"
        fill="none"
        strokeLinecap="round"
      />
    ),
  },
  {
    label: "Members",
    path: "/members",
    icon: (
      <path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Billing",
    path: "/billing",
    icon: (
      <path
        d="M2 7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7zM2 11h20"
        fill="none"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Reports",
    path: "/reports",
    icon: (
      <path d="M4 20V10M11 20V4M18 20v-7" fill="none" strokeLinecap="round" />
    ),
  },
  {
    label: "Settings",
    path: "/settings",
    icon: (
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z
        M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { logout, user } = useSubAdmin();

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);
    logout();
    onClose?.();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-navy/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 z-40 flex h-screen w-64 shrink-0 flex-col bg-navy transition-transform duration-200 lg:sticky ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <Link
          to="/dashboard"
          onClick={onClose}
          className="flex h-20 shrink-0 items-center gap-2.5 px-6"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/10">
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

          <span className="font-display text-xl font-semibold text-cream">
            Hotel<span className="text-gold">OS</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
          {items.map((item) => {
            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-gold/15 font-medium text-gold"
                      : "text-cream/60 hover:bg-cream/5 hover:text-cream"
                  }`
                }
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  {item.icon}
                </svg>

                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Logged-in user */}
        <div className="border-t border-cream/10 px-4 py-3">
          <div className="flex items-center gap-2.5 px-3.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 font-display text-sm font-semibold text-gold">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-cream">
                {user?.name || "Sub Admin"}
              </p>

              <p className="truncate text-xs capitalize text-cream/50">
                {(user?.role || "sub admin").toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="border-t border-cream/10 px-4 py-5">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-cream/60 transition-colors hover:bg-cream/5 hover:text-cream disabled:opacity-60"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path
                d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
