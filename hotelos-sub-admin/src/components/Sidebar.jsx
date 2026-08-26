import { Link, useLocation } from "react-router-dom";

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
      <path
        d="M4 20V10M11 20V4M18 20v-7"
        fill="none"
        strokeLinecap="round"
      />
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
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-navy/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-64 bg-navy shrink-0 flex flex-col transition-transform duration-200 ${
          open
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <Link
          to="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 px-6 h-20 shrink-0"
        >
          <span className="w-9 h-9 rounded-full bg-cream/10 flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
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
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive =
              location.pathname === item.path;

            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-gold/15 text-gold font-medium"
                    : "text-cream/60 hover:bg-cream/5 hover:text-cream"
                }`}
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
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-5 border-t border-cream/10">
          <Link
            to="/login"
            onClick={() => {
              localStorage.removeItem("auth_token");
              localStorage.removeItem("auth_user");
              onClose?.();
            }}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-cream/60 hover:bg-cream/5 hover:text-cream transition-colors"
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
          </Link>
        </div>
      </aside>
    </>
  );
}