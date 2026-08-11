import type { Room, RoomStatus } from "../types";

interface RoomGridProps {
   rooms: Room[];
   onRoomClick: (room: Room) => void;
}

const STATUS_LABEL: Record<RoomStatus, string> = {
   available: "AVAILABLE",
   occupied: "OCCUPIED",
   reserved: "RESERVED",
   cleaning: "NEEDS CLEANING",
};

const LEGEND: { status: RoomStatus; label: string }[] = [
   { status: "available", label: "Available" },
   { status: "occupied", label: "Occupied" },
   { status: "reserved", label: "Reserved" },
   { status: "cleaning", label: "Needs cleaning" },
];

export function RoomGrid({ rooms, onRoomClick }: RoomGridProps) {
   return (
      <div className="card" style={{ padding: 20 }}>
         <div className="section-title">
            <span className="section-title-bar" />
            <span className="section-title-text">
               ROOM GRID — TAP A ROOM TO ASSIGN, CHECK IN OR CHECK OUT
            </span>
         </div>

         <div className="room-grid">
            {rooms.map((room) => {
               const label =
                  room.status === "occupied" && room.guestName
                     ? room.guestName.split(" ")[0].toUpperCase()
                     : STATUS_LABEL[room.status];

               return (
                  <button
                     key={room.id}
                     className={`room-card ${room.status}`}
                     onClick={() => onRoomClick(room)}
                  >
                     <svg
                        className={`room-icon ${room.status}`}
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                     >
                        <rect x="2" y="7" width="20" height="14" rx="2" />
                        <path d="M2 12h20" />
                        <path d="M7 12V7" />
                     </svg>
                     <span className="room-number">{room.number}</span>
                     <span className={`room-status ${room.status}`}>
                        {label}
                     </span>
                     <span className={`room-bar ${room.status}`} />
                  </button>
               );
            })}
         </div>

         <div
            className="flex items-center flex-wrap gap-4"
            style={{ fontSize: 12, color: "#6b7280" }}
         >
            {LEGEND.map((l) => (
               <span key={l.label} className="flex items-center gap-1.5">
                  <span className={`legend-dot ${l.status}`} />
                  {l.label}
               </span>
            ))}
         </div>
      </div>
   );
}
