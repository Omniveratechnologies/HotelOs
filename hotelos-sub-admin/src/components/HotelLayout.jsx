import { useState } from "react";
import { Navigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";

export default function HotelLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const token = localStorage.getItem("auth_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

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
