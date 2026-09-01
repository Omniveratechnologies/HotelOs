import React from "react";

const statCards = (rooms, serviceRequests, foodOrders) => {
  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const available = rooms.filter((r) => r.status === "available").length;
  const reserved = rooms.filter((r) => r.status === "reserved").length;
  const pending = serviceRequests.filter(
    (r) => r.status === "requested",
  ).length;
  const activeOrders = foodOrders.filter(
    (o) => o.status !== "delivered",
  ).length;
  const todayRevenue = rooms
    .filter((r) => r.status === "occupied")
    .reduce((sum, r) => sum + r.rate, 0);
  return [
    {
      label: "Occupied Rooms",
      value: occupied,
      icon: "🏨",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Available Rooms",
      value: available,
      icon: "🔑",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Reserved",
      value: reserved,
      icon: "📅",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Pending Requests",
      value: pending,
      icon: "🔔",
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Active Food Orders",
      value: activeOrders,
      icon: "🍽️",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Today's Revenue",
      value: `₹${todayRevenue.toLocaleString()}`,
      icon: "💰",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];
};

export default function StatCards({ rooms, serviceRequests, foodOrders }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {statCards(rooms, serviceRequests, foodOrders).map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs"
        >
          <div
            className={`h-9 w-9 ${card.bg} mb-3 flex items-center justify-center rounded-xl text-lg`}
          >
            {card.icon}
          </div>
          <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          <div className="mt-0.5 text-xs tracking-wide text-gray-500 uppercase">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
