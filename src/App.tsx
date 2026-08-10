import { useState, useMemo } from "react";
import "./index.css";

import type { Room, ServiceRequest, CheckInFormData } from "./types";
import {
   initialRooms,
   initialServiceRequests,
   initialFoodOrders,
} from "./data";

import { Header } from "./components/Header";
import { StatsCards } from "./components/StatsCards";
import { RoomGrid } from "./components/RoomGrid";
import { ServiceRequests } from "./components/ServiceRequests";
import { FoodOrders } from "./components/FoodOrders";
import { CheckInModal } from "./components/CheckInModal";
import { CheckOutModal } from "./components/CheckOutModal";

type ModalState =
   | { type: "none" }
   | { type: "checkin"; room: Room }
   | { type: "checkout"; room: Room };

export default function App() {
   const [rooms, setRooms] = useState(initialRooms);
   const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(
      initialServiceRequests,
   );
   const [foodOrders] = useState(initialFoodOrders);
   const [modal, setModal] = useState<ModalState>({ type: "none" });

   const stats = useMemo(
      () => ({
         occupiedRooms: rooms.filter((r) => r.status === "occupied").length,
         availableRooms: rooms.filter((r) => r.status === "available").length,
         totalRooms: rooms.length,
         pendingRequests: serviceRequests.filter(
            (r) => r.status === "requested",
         ).length,
         activeFoodOrders: foodOrders.filter((o) => o.status !== "delivered")
            .length,
      }),
      [rooms, serviceRequests, foodOrders],
   );

   const handleRoomClick = (room: Room) => {
      if (room.status === "available") setModal({ type: "checkin", room });
      else if (room.status === "occupied") setModal({ type: "checkout", room });
   };

   const handleCheckIn = (data: CheckInFormData) => {
      if (modal.type !== "checkin") return;
      const id = modal.room.id;
      setRooms((prev) =>
         prev.map((r) =>
            r.id !== id
               ? r
               : {
                    ...r,
                    status: "occupied",
                    guestName: data.guestName,
                    guestPhone: data.phone,
                    guestCount: data.guests,
                    nights: data.nights,
                    idProof: data.idProof,
                    checkInTime: new Date().toLocaleTimeString("en-IN", {
                       hour: "2-digit",
                       minute: "2-digit",
                    }),
                 },
         ),
      );
      setModal({ type: "none" });
   };

   const handleCheckOut = () => {
      if (modal.type !== "checkout") return;
      const id = modal.room.id;
      setRooms((prev) =>
         prev.map((r) =>
            r.id !== id
               ? r
               : {
                    ...r,
                    status: "cleaning",
                    guestName: undefined,
                    guestPhone: undefined,
                    guestCount: undefined,
                    nights: undefined,
                    idProof: undefined,
                    checkInTime: undefined,
                 },
         ),
      );
      setModal({ type: "none" });
   };

   const handleAcknowledge = (reqId: string) =>
      setServiceRequests((prev) =>
         prev.map((r) =>
            r.id === reqId ? { ...r, status: "acknowledged" as const } : r,
         ),
      );

   return (
      <div
         style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "#f0ede8",
         }}
      >
         <Header />

         <div
            style={{
               height: 3,
               background: "linear-gradient(90deg, #c9a84c, #d4b96a)",
            }}
         />

         <main
            style={{
               flex: 1,
               maxWidth: 1400,
               width: "100%",
               margin: "0 auto",
               padding: "16px 16px 48px",
            }}
         >
            <StatsCards stats={stats} />

            <div className="content-grid">
               <div className="flex flex-col gap-5 min-w-0">
                  <RoomGrid rooms={rooms} onRoomClick={handleRoomClick} />
                  <FoodOrders orders={foodOrders} />
               </div>
               <div className="min-w-0">
                  <ServiceRequests
                     requests={serviceRequests}
                     onAcknowledge={handleAcknowledge}
                  />
               </div>
            </div>
         </main>

         {modal.type === "checkin" && (
            <CheckInModal
               roomNumber={modal.room.number}
               onConfirm={handleCheckIn}
               onClose={() => setModal({ type: "none" })}
            />
         )}
         {modal.type === "checkout" && (
            <CheckOutModal
               room={modal.room}
               onCheckOut={handleCheckOut}
               onClose={() => setModal({ type: "none" })}
            />
         )}
      </div>
   );
}
