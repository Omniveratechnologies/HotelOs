import React, { useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { Sidebar } from "@hotelos/ui/components/Sidebar";
import { useSidebarStore } from "@hotelos/stores";
import { clearAuth, getStoredUser } from "@hotelos/api";
import Chatbot from "../../features/chat/components/Chatbot.jsx";
import { AppProviders } from "../providers/AppProviders.jsx";
import { useHotelOS } from "../../hooks/useHotelOS.js";

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
  reservations: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
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
  ratePlans: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  roomTypes: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <rect x="4" y="4" width="7" height="7" />
      <rect x="13" y="4" width="7" height="4" />
      <rect x="13" y="10" width="7" height="10" />
      <rect x="4" y="13" width="7" height="7" />
    </svg>
  ),
  inventory: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        strokeLinejoin="round"
      />
    </svg>
  ),
  operations: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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
  {
    id: "frontDesk",
    label: "Front Desk",
    icon: (
      /* Front Desk icon */ <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <circle cx="12" cy="8" r="2" />
      </svg>
    ),
    subMenu: [
      {
        id: "check-in",
        label: "Front Desk Check-in",
        path: "/front-desk/check-in",
        end: true,
      },
      {
        id: "express-check-in",
        label: "Express Check-in",
        path: "/front-desk/express-check-in",
        end: true,
      },
      {
        id: "digital-check-in-list",
        label: "Digital Check-ins",
        path: "/front-desk/digital-check-in-list",
        end: true,
      },
      {
        id: "check-out",
        label: "Guest Check-out",
        path: "/front-desk/check-out",
        end: true,
      },
      {
        id: "registration-cards",
        label: "Registration Cards",
        path: "/front-desk/registration-cards",
        end: true,
      },
      {
        id: "key-cards",
        label: "Key Card Assignment",
        path: "/front-desk/key-cards",
        end: true,
      },
    ],
  },
  {
    id: "reservations",
    label: "Reservations",
    path: "/reservations",
    icon: icons.reservations,
    subMenu: [
      {
        id: "all-reservations",
        label: "All Reservations",
        path: "/reservations",
        end: true,
      },
      {
        id: "new-reservation",
        label: "New Reservation",
        path: "/reservations/new",
      },
      {
        id: "phone-reservation",
        label: "Phone Reservation",
        path: "/reservations/phone/new",
      },
      {
        id: "website-reservation",
        label: "Website Reservation",
        path: "/reservations/website/new",
      },
      {
        id: "corporate-reservation",
        label: "Corporate Reservation",
        path: "/reservations/corporate/new",
      },
      {
        id: "group-reservation",
        label: "Group Reservation",
        path: "/reservations/group/new",
      },
      {
        id: "repeat-guest-reservation",
        label: "Repeat Guest Booking",
        path: "/reservations/repeat/new",
      },
    ],
  },
  { id: "guests", label: "Guests", path: "/guests", icon: icons.guests },
  {
    id: "inventory",
    label: "Inventory",
    icon: icons.inventory,
    subMenu: [
      { id: "rooms", label: "Rooms", path: "/rooms", icon: icons.rooms },
      {
        id: "roomTypes",
        label: "Room Types",
        path: "/room-types",
        icon: icons.roomTypes,
      },
      {
        id: "ratePlans",
        label: "Rate Plans",
        path: "/rate-plans",
        icon: icons.ratePlans,
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: icons.operations,
    subMenu: [
      { id: "food", label: "Food Orders", path: "/food", icon: icons.food },
      {
        id: "housekeeping",
        label: "Housekeeping",
        path: "/housekeeping",
        icon: icons.housekeeping,
      },
    ],
  },
  {
    id: "management",
    label: "Management",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    subMenu: [
      {
        id: "corporate-companies-manage",
        label: "Corporate Companies",
        path: "/manage/corporate-companies",
      },
      {
        id: "key-cards-manage",
        label: "Key Cards Inventory",
        path: "/manage/key-cards",
      },
      {
        id: "kiosks-manage",
        label: "Kiosk Terminals",
        path: "/manage/kiosk-devices",
      },
    ],
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

  const isSidebarOpen = useSidebarStore((s) => s.isSidebarOpen);
  const closeSidebar = useSidebarStore((s) => s.closeSidebar);

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
    closeSidebar();
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
        items={items.map((item) => {
          if (item.id === "housekeeping") {
            return Object.assign({}, item, {
              badge: pendingRequests || undefined,
            });
          }
          if (item.subMenu?.length) {
            return Object.assign({}, item, {
              subMenu: item.subMenu.map((sub) =>
                sub.id === "housekeeping"
                  ? Object.assign({}, sub, {
                      badge: pendingRequests || undefined,
                    })
                  : sub,
              ),
            });
          }
          return item;
        })}
        brand={{ title: "HotelOS", subtitle: hotelName }}
        header={header}
        user={{ name: user.name || "Receptionist", role: "Receptionist" }}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <main className="min-w-0 flex-1">
        <Outlet />
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
    <AppProviders>
      <DashboardShell />
    </AppProviders>
  );
}
