import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar.jsx";
import { SubAdminProvider } from "../app/providers.jsx";

export default function HotelLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SubAdminProvider>
      <div className="bg-ivory font-body flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </SubAdminProvider>
  );
}
