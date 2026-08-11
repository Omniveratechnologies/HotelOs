import type { Room } from "../types";

interface CheckOutModalProps {
   room: Room;
   onCheckOut: () => void;
   onClose: () => void;
}

export function CheckOutModal({
   room,
   onCheckOut,
   onClose,
}: CheckOutModalProps) {
   const roomCharges = (room.ratePerNight ?? 0) * (room.nights ?? 1);
   const nightLabel = (room.nights ?? 1) > 1 ? "nights" : "night";

   return (
      <div className="modal-overlay anim-fadeIn" onClick={onClose}>
         <div
            className="modal-box anim-slideUp"
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
         >
            <div className="modal-gold-bar" />

            <div
               className="flex items-center justify-between"
               style={{ padding: "18px 18px 16px" }}
            >
               <h2
                  className="italic font-bold"
                  style={{ fontSize: 18, color: "#1a2744" }}
               >
                  Room {room.number} — {room.guestName}
               </h2>
               <button className="modal-close" onClick={onClose}>
                  ×
               </button>
            </div>

            <div
               className="flex flex-col gap-3"
               style={{ padding: "0 18px 16px" }}
            >
               <div className="flex justify-between items-center">
                  <span style={{ fontSize: 14, color: "#6b7280" }}>
                     Room charges ({room.nights} {nightLabel})
                  </span>
                  <span
                     style={{ fontSize: 14, fontWeight: 500, color: "#1a2744" }}
                  >
                     ₹{roomCharges.toLocaleString("en-IN")}
                  </span>
               </div>

               <div style={{ height: 1, background: "#e5e0d8" }} />

               <div
                  className="flex justify-between items-center"
                  style={{ paddingTop: 4 }}
               >
                  <span
                     style={{ fontSize: 16, fontWeight: 700, color: "#1a2744" }}
                  >
                     Total due
                  </span>
                  <span
                     style={{ fontSize: 16, fontWeight: 700, color: "#1a2744" }}
                  >
                     ₹{roomCharges.toLocaleString("en-IN")}
                  </span>
               </div>
            </div>

            <div className="flex gap-3" style={{ padding: "0 18px 20px" }}>
               <button className="btn-outline" onClick={onClose}>
                  CLOSE
               </button>
               <button className="btn-navy-sm" onClick={onCheckOut}>
                  CHECK OUT & SETTLE
               </button>
            </div>
         </div>
      </div>
   );
}
