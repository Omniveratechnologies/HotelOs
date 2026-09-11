import React, { useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { Sidebar } from "@hotelos/ui/components/Sidebar";
import Chatbot from "../components/Chatbot.jsx";
import { HotelOSProvider } from "../app/providers.jsx";
import { useHotelOS } from "../app/useHotelOS.js";
import { clearAuth, getStoredUser } from "../services/auth.service.js";

const icons = {
  dashboard: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  rooms: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  guests: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  food: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
    </svg>
  ),
  housekeeping: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  reports: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  settings: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93l-1.42 1.42M4.93 19.07l1.42-1.42M20 12h2M2 12h2M19.07 19.07l-1.42-1.42M4.93 4.93l1.42 1.42M12 20v2M12 2v2" />
    </svg>
  ),
};

const items = [
  { id: "dashboard", label: "Dashboard", path: "/", icon: icons.dashboard },
  { id: "rooms", label: "Rooms", path: "/rooms", icon: icons.rooms },
  { id: "guests", label: "Guests", path: "/guests", icon: icons.guests },
  { id: "food", label: "Food Orders", path: "/food", icon: icons.food },
  {
    id: "housekeeping",
    label: "Housekeeping",
    path: "/housekeeping",
    icon: icons.housekeeping,
  },
  { id: "reports", label: "Reports", path: "/reports", icon: icons.reports },
  {
    id: "settings",
    label: "Settings",
    path: "/settings",
    icon: icons.settings,
  },
];

function DashboardShell() {
  const { rooms, serviceRequests, foodOrders, chatOpen, setChatOpen, stats } =
    useHotelOS();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const user = useMemo(() => getStoredUser() || {}, []);
  const hotelName = stats?.hotelName || "Grand Residency";
  const pendingRequests = serviceRequests.filter(
    (r) => r.status === "requested",
  ).length;
  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const freeRooms = rooms.filter((r) => r.status === "available").length;

  const handleLogout = () => {
    setLogoutLoading(true);
    clearAuth();
    navigate("/login", { replace: true });
  };

  const header = (
    <div className="bg-background-100 mx-3 mt-3 mb-1 flex gap-3 rounded-xl p-3">
      <div className="flex-1 text-center">
        <div className="text-brand-900 text-lg leading-none font-bold">
          {occupiedRooms}
        </div>
        <div className="text-brand-700/60 mt-0.5 text-[10px]">Occupied</div>
      </div>
      <div className="bg-surface-300 w-px" />
      <div className="flex-1 text-center">
        <div className="text-primary-600 text-lg leading-none font-bold">
          {pendingRequests}
        </div>
        <div className="text-brand-700/60 mt-0.5 text-[10px]">Pending</div>
      </div>
      <div className="bg-surface-300 w-px" />
      <div className="flex-1 text-center">
        <div className="text-lg leading-none font-bold text-green-600">
          {freeRooms}
        </div>
        <div className="text-brand-700/60 mt-0.5 text-[10px]">Free</div>
      </div>
    </div>
  );

  return (
    <div className="bg-background-50 flex min-h-screen">
      <Sidebar
        items={items.map((item) =>
          item.id === "housekeeping"
            ? Object.assign({}, item, { badge: pendingRequests || undefined })
            : item,
        )}
        brand={{ title: "HotelOS", subtitle: hotelName }}
        header={header}
        user={{ name: user.name || "Receptionist", role: "Receptionist" }}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="min-w-0 flex-1">
        <Outlet
          context={{
            isSidebarOpen,
            toggleSidebar: () => setIsSidebarOpen((prev) => !prev),
          }}
        />
      </main>

      <Chatbot
        isOpen={chatOpen}
        setIsOpen={setChatOpen}
        rooms={rooms}
        serviceRequests={serviceRequests}
        foodOrders={foodOrders}
      />
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <HotelOSProvider>
      <DashboardShell />
    </HotelOSProvider>
  );
}
