import { useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { Sidebar } from "@hotelos/ui/components/Sidebar";
import { useSidebarStore } from "@hotelos/stores";
import { getStoredUser, clearAuth } from "@hotelos/api";
import { AppProviders } from "../AppProviders.jsx";

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

const NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: icon(
      <path d="M4 13h6V4H4v9zM14 20h6v-9h-6v9zM14 4v5h6V4h-6zM4 20h6v-5H4v5z" />,
    ),
  },
  {
    label: "Hotels",
    path: "/hotels",
    icon: icon(<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />),
  },
  {
    label: "Transactions",
    path: "/transactions",
    icon: icon(
      <path
        d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
        strokeLinecap="round"
      />,
    ),
  },
  {
    label: "Subscriptions",
    path: "/subscriptions",
    icon: icon(
      <path
        d="M8 2v4M16 2v4M3 6h18M3 10h18M3 14h18M3 18h18"
        strokeLinecap="round"
      />,
    ),
  },
  {
    label: "Service Requests",
    path: "/service-requests",
    icon: icon(
      <path
        d="M12 22v-8M5 12l7-7 7 7M5 12v8a2 2 0 002 2h10a2 2 0 002-2v-8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />,
    ),
  },
  {
    label: "Channel Approvals",
    path: "/channel-approvals",
    icon: icon(
      <path
        d="M9 12l2 2 4-4M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />,
    ),
  },
  {
    label: "Channel Manager",
    path: "/channel-manager",
    icon: icon(<path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />),
  },
  {
    label: "Settings",
    path: "/settings",
    icon: icon(
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z
        M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />,
    ),
  },
];

export default function DashboardLayout() {
  return (
    <AppProviders>
      <DashboardShell />
    </AppProviders>
  );
}

function DashboardShell() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const isSidebarOpen = useSidebarStore((s) => s.isSidebarOpen);
  const closeSidebar = useSidebarStore((s) => s.closeSidebar);

  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = () => {
    setLogoutLoading(true);
    clearAuth();
    closeSidebar();
    navigate("/login", { replace: true });
  };

  return (
    <div className="bg-background-50 flex min-h-screen">
      <Sidebar
        items={NAV_ITEMS}
        brand={{ title: "HotelOS", subtitle: "Super Admin" }}
        user={{ name: user?.name || "Super Admin", role: "SUPER_ADMIN" }}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
