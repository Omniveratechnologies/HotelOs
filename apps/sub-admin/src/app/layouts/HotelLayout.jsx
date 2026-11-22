import { useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { Sidebar } from "@hotelos/ui/components/Sidebar";

import { useSidebarStore } from "@hotelos/stores";
import { getStoredUser, clearAuth } from "@hotelos/api";
import { AppProviders } from "../providers/AppProviders.jsx";
import {
  DASHBOARD_IDS,
  DASHBOARDS,
} from "../../features/intelligence/legacy/lib/intelligence-data.js";
import {
  POS_DASHBOARD_IDS,
  POS_DASHBOARDS,
} from "../../features/intelligence/legacy/lib/pos/intelligence-data.js";
import {
  BI_DASHBOARD_IDS,
  BI_DASHBOARDS,
} from "../../features/intelligence/legacy/lib/bi/intelligence-data.js";

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
    label: "Inventory",
    icon: icon(
      <path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        fill="none"
        strokeLinejoin="round"
      />,
    ),
    subMenu: [
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
        label: "Room Types",
        path: "/room-types",
        icon: icon(
          <path
            d="M4 4h7v7H4V4zM13 4h7v4h-7V4zM13 10h7v10h-7V10zM4 13h7v7H4v-7z"
            strokeLinejoin="round"
          />,
        ),
      },
      {
        label: "Rate Plans",
        path: "/rate-plans",
        icon: icon(
          <path
            d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
            strokeLinecap="round"
          />,
        ),
      },
    ],
  },
  // TODO: Pending route implementation in sub-admin router
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
  // TODO: Pending route implementation in sub-admin router
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
  // TODO: Pending route implementation in sub-admin router
  {
    label: "Reports",
    path: "/reports",
    icon: icon(
      <path d="M4 20V10M11 20V4M18 20v-7" fill="none" strokeLinecap="round" />,
    ),
  },
  { section: "AI ANALYTICS", id: "ai-analytics-section" },
  {
    label: "PMS Intelligence",
    path: "/intelligence/pms/revenue",
    defaultOpen: true,
    icon: icon(
      <path d="M4 19V5m0 14h16M8 15l3-4 3 2 5-7" strokeLinecap="round" />,
    ),
    subMenu: DASHBOARD_IDS.map((id) => ({
      label: DASHBOARDS[id].title,
      path: `/intelligence/pms/${id}`,
    })),
  },
  {
    label: "POS Intelligence",
    path: "/intelligence/pos/sales",
    icon: icon(
      <path d="M3 4h2l2.2 10.2a2 2 0 002 1.6h8.6a2 2 0 002-1.6L22 8H6M10 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />,
    ),
    subMenu: POS_DASHBOARD_IDS.map((id) => ({
      label: POS_DASHBOARDS[id].title,
      path: `/intelligence/pos/${id}`,
    })),
  },
  {
    label: "Business Intelligence",
    path: "/intelligence/bi/total-revenue",
    icon: icon(
      <path d="M4 19V5m0 14h16M7 15l4-4 3 3 6-7" strokeLinecap="round" />,
    ),
    subMenu: BI_DASHBOARD_IDS.map((id) => ({
      label: BI_DASHBOARDS[id].title,
      path: `/intelligence/bi/${id}`,
    })),
  },
  {
    label: "Analytics Reports",
    path: "/intelligence/reports",
    icon: icon(
      <path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5" strokeLinecap="round" />,
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
    <AppProviders>
      <HotelShell />
    </AppProviders>
  );
}

function HotelShell() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const isSidebarOpen = useSidebarStore((s) => s.isSidebarOpen);
  const closeSidebar = useSidebarStore((s) => s.closeSidebar);

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);
    clearAuth();
    closeSidebar();
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
        onClose={closeSidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
