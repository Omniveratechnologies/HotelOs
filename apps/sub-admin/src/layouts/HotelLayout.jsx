import { useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { Sidebar } from "@hotelos/ui/components/Sidebar";

import { SubAdminProvider } from "../app/providers.jsx";
import { useSubAdmin } from "../app/subAdminContext.js";

const icon = (paths) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    {paths}
  </svg>
);

const items = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: icon(
      <path d="M4 13h6V4H4v9zM14 20h6v-9h-6v9zM14 4v5h6V4h-6zM4 20h6v-5H4v5z" />,
    ),
  },
  {
    label: "Reservations",
    path: "/reservations",
    icon: icon(
      <path
        d="M4 5h16v15H4zM4 9h16M8 3v4M16 3v4"
        fill="none"
        strokeLinecap="round"
      />,
    ),
  },
  {
    label: "Rooms",
    path: "/rooms",
    icon: icon(
      <path
        d="M3 21V9l9-6 9 6v12M9 21v-6h6v6"
        fill="none"
        strokeLinejoin="round"
      />,
    ),
  },
  {
    label: "Guests",
    path: "/guests",
    icon: icon(
      <path
        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />,
    ),
  },
  {
    label: "Housekeeping",
    path: "/housekeeping",
    icon: icon(
      <path
        d="M4 4l16 16M8 4l12 12M4 8l8 8"
        fill="none"
        strokeLinecap="round"
      />,
    ),
  },
  {
    label: "Members",
    path: "/members",
    icon: icon(
      <path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />,
    ),
  },
  {
    label: "Billing",
    path: "/billing",
    icon: icon(
      <path
        d="M2 7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7zM2 11h20"
        fill="none"
        strokeLinejoin="round"
      />,
    ),
  },
  {
    label: "Reports",
    path: "/reports",
    icon: icon(
      <path d="M4 20V10M11 20V4M18 20v-7" fill="none" strokeLinecap="round" />,
    ),
  },
  {
    label: "Settings",
    path: "/settings",
    icon: icon(
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z
        M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />,
    ),
  },
];

export default function HotelLayout() {
  return (
    <SubAdminProvider>
      <HotelShell />
    </SubAdminProvider>
  );
}

function HotelShell() {
  const navigate = useNavigate();
  const { user, logout } = useSubAdmin();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);
    logout();
    setIsSidebarOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="bg-background-50 flex min-h-screen">
      <Sidebar
        items={items}
        brand={{ title: "HotelOS" }}
        user={{ name: user?.name, role: user?.role }}
        onLogout={handleLogout}
        logoutLoading={loggingOut}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet
          context={{
            isSidebarOpen,
            toggleSidebar: () => setIsSidebarOpen((prev) => !prev),
          }}
        />
      </div>
    </div>
  );
}
