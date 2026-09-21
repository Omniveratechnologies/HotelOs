import React, { useMemo, useState } from "react";
import RoomModal from "../../components/RoomModal.jsx";
import { useHotelOS } from "../../app/useHotelOS.js";
import { getStoredUser } from "../../services/auth.service.js";
import StatCards from "./_components/StatCards.jsx";
import RoomGrid from "./_components/RoomGrid.jsx";
import ServiceRequestsList from "./_components/ServiceRequestsList.jsx";
import FoodOrdersList from "./_components/FoodOrdersList.jsx";
import RecentActivity from "./_components/RecentActivity.jsx";
import { Header } from "@hotelos/ui/components/Header";

function getGreetingInfo() {
  const now = new Date();
  const currentHour = now.getHours();

  let greeting = "Good Morning";

  if (currentHour >= 12 && currentHour < 17) {
    greeting = "Good Afternoon";
  } else if (currentHour >= 17) {
    greeting = "Good Evening";
  }

  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return { greeting, date };
}

export default function Dashboard() {
  const {
    rooms,
    serviceRequests,
    foodOrders,
    updateRoomStatus,
    acknowledgeRequest,
    completeRequest,
    guests,
    stats,
    statsError,
  } = useHotelOS();
  const [selectedRoom, setSelectedRoom] = useState(null);

  const user = useMemo(() => getStoredUser() || {}, []);
  const firstName = user.name?.trim().split(" ")[0] || "Receptionist";
  const hotelName = stats?.hotelName || "your hotel";
  const recentActivity = stats?.recentActivities || [];

  const { greeting, date } = getGreetingInfo();

  return (
    <>
      <Header
        pageTitle={`${greeting}, ${firstName} 👋`}
        pageDescription={`${date} • ${hotelName}`}
      >
        {/* TODO: Add search and notification implementation */}
        <button className="bg-brand-900 hover:bg-brand-800 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors">
          + New Booking
        </button>
        <button className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
          Export Report
        </button>
      </Header>
      <div className="space-y-6 p-6">
        {/* <DashboardHeader firstName={firstName} hotelName={hotelName} /> */}

        <StatCards
          rooms={rooms}
          serviceRequests={serviceRequests}
          foodOrders={foodOrders}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <RoomGrid rooms={rooms} onSelectRoom={setSelectedRoom} />

          <div className="space-y-4">
            <ServiceRequestsList
              serviceRequests={serviceRequests}
              acknowledgeRequest={acknowledgeRequest}
              completeRequest={completeRequest}
            />
            <FoodOrdersList foodOrders={foodOrders} />
            <RecentActivity
              recentActivity={recentActivity}
              statsError={statsError}
            />
          </div>
        </div>

        {selectedRoom && (
          <RoomModal
            room={selectedRoom}
            onClose={() => setSelectedRoom(null)}
            updateRoomStatus={updateRoomStatus}
            guests={guests}
          />
        )}
      </div>
    </>
  );
}
