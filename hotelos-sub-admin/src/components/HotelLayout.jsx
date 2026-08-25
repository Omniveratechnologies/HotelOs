import { useState } from "react";
import Sidebar from "./Sidebar.jsx";

export default function HotelLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ivory flex font-body">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}