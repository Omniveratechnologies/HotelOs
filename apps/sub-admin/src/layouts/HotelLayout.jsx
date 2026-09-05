import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar.jsx";
import { SubAdminProvider } from "../app/providers.jsx";

export default function HotelLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <SubAdminProvider>
      <div className="bg-background-50 flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />

        <div className="min-w-0 flex-1">
          <Outlet context={{ openSidebar, closeSidebar }} />
        </div>
      </div>
    </SubAdminProvider>
  );
}
