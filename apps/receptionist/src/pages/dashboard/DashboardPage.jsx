import React, { useMemo, useState } from "react";
import RoomModal from "../../components/RoomModal.jsx";
import { useHotelOS } from "../../app/useHotelOS.js";
import { getStoredUser } from "../../services/auth.service.js";
import DashboardHeader from "./_components/DashboardHeader.jsx";
import StatCards from "./_components/StatCards.jsx";
import RoomGrid from "./_components/RoomGrid.jsx";
import ServiceRequestsList from "./_components/ServiceRequestsList.jsx";
import FoodOrdersList from "./_components/FoodOrdersList.jsx";
import RecentActivity from "./_components/RecentActivity.jsx";

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

  return (
    <div className="space-y-6 p-6">
      <DashboardHeader firstName={firstName} hotelName={hotelName} />

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
  );
}
