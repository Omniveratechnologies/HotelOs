import React from "react";
import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar.jsx";
import Chatbot from "../components/Chatbot.jsx";
import { HotelOSProvider } from "../app/providers.jsx";
import { useHotelOS } from "../app/useHotelOS.js";

function DashboardShell() {
  const { rooms, serviceRequests, foodOrders, chatOpen, setChatOpen } =
    useHotelOS();

  return (
    <div className="bg-cream-50 flex h-screen overflow-hidden">
      <Sidebar rooms={rooms} serviceRequests={serviceRequests} />
      <main className="flex-1 overflow-auto">
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
    <HotelOSProvider>
      <DashboardShell />
    </HotelOSProvider>
  );
}
