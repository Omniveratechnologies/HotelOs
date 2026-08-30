import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar.jsx";
import {
  SubAdminProvider,
} from "../app/providers.jsx";

export default function HotelLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SubAdminProvider>
      <div className="min-h-screen bg-ivory flex font-body">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </SubAdminProvider>
  );
}
