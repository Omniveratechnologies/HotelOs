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
            <div
               key={card.label}
               className="card"
               style={{ padding: "24px 20px" }}
            >
               <div
                  className="flex items-center justify-center rounded-lg mb-4"
                  style={{
                     width: 40,
                     height: 40,
                     background: "#1a2744",
                     fontSize: 18,
                  }}
               >
                  {card.icon}
               </div>
               <div
                  style={{
                     fontSize: 38,
                     fontWeight: 800,
                     color: "#1a2744",
                     lineHeight: 1,
                     marginBottom: 8,
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
