import React from "react";
import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar.jsx";
import Chatbot from "../components/Chatbot.jsx";
import { HotelOSProvider, useHotelOS } from "../app/providers.jsx";

function DashboardShell() {
  const { rooms, serviceRequests, foodOrders, chatOpen, setChatOpen } =
    useHotelOS();

  return (
    <div className="flex h-screen overflow-hidden bg-cream-50">
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
