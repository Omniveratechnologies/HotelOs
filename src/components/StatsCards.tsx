import type { DashboardStats } from "../types";

interface StatsCardsProps {
   stats: DashboardStats;
}

const CARDS: { icon: string; key: keyof DashboardStats; label: string }[] = [
   { icon: "🏠", key: "occupiedRooms", label: "OCCUPIED ROOMS" },
   { icon: "🛎️", key: "availableRooms", label: "AVAILABLE ROOMS" },
   { icon: "🏨", key: "totalRooms", label: "TOTAL ROOMS" },
   { icon: "⏰", key: "pendingRequests", label: "PENDING REQUESTS" },
   { icon: "🍽️", key: "activeFoodOrders", label: "ACTIVE FOOD ORDERS" },
];

export function StatsCards({ stats }: StatsCardsProps) {
   return (
      <div className="stats-grid">
         {CARDS.map((card) => (
            <div key={card.label} className="card stats-card">
               <div
                  className="flex items-center justify-center rounded-lg"
                  style={{
                     width: 36,
                     height: 36,
                     background: "#1a2744",
                     fontSize: 16,
                     marginBottom: 10,
                     flexShrink: 0,
                  }}
               >
                  {card.icon}
               </div>
               <div
                  style={{
                     fontSize: 32,
                     fontWeight: 800,
                     color: "#1a2744",
                     lineHeight: 1,
                     marginBottom: 6,
                  }}
               >
                  {stats[card.key]}
               </div>
               <div className="label-sm">{card.label}</div>
            </div>
         ))}
      </div>
   );
}
