import React, { useMemo, useState } from "react";
import RoomModal from "../../components/RoomModal.jsx";
import { useHotelOS } from "../../app/providers.jsx";
import { getStoredUser } from "../../services/auth.service.js";

const statusColor = {
  available: "border-green-500 text-green-600",
  occupied: "border-blue-500 text-blue-600",
  reserved: "border-amber-500 text-amber-600",
  cleaning: "border-gray-400 text-gray-500",
};

const statusBg = {
  available: "bg-green-50",
  occupied: "bg-blue-50",
  reserved: "bg-amber-50",
  cleaning: "bg-gray-50",
};

function formatRelativeTime(date) {
  if (!date) return "";
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hr ago" : `${hours} hrs ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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
  const floors = [1, 2, 3];

  const user = useMemo(() => getStoredUser() || {}, []);
  const firstName = user.name?.trim().split(" ")[0] || "Receptionist";
  const hotelName = stats?.hotelName || "your hotel";
  const recentActivity = stats?.recentActivities || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0f1f3d]">
            Good Morning, {firstName} 👋
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {formatToday()} · {hotelName}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-xl bg-[#0f1f3d] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#162847]">
            + New Booking
          </button>
          <button className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            Export Report
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {statCards(rooms, serviceRequests, foodOrders).map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div
              className={`h-9 w-9 ${card.bg} mb-3 flex items-center justify-center rounded-xl text-lg`}
            >
              {card.icon}
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
            <div className="mt-0.5 text-xs uppercase tracking-wide text-gray-500">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Room Grid */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-[#0f1f3d]">
              <span className="inline-block h-5 w-1 rounded-full bg-[#c9a84c]" />
              Room Grid — Tap a room to manage
            </h2>
          </div>
          <div className="space-y-4">
            {floors.map((floor) => (
              <div key={floor}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Floor {floor}
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {rooms
                    .filter((r) => r.floor === floor)
                    .map((room) => (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`cursor-pointer rounded-xl border-2 p-2 text-center transition-all hover:scale-105 hover:shadow-md ${statusColor[room.status]} ${statusBg[room.status]}`}
                      >
                        <div className="mb-1 text-4xl">🛏</div>
                        <div className="text-sm font-bold">
                          {room.roomNumber}
                        </div>
                        <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide">
                          {room.status}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 border-t border-gray-100 pt-4">
            {[
              ["available", "bg-green-500", "Available"],
              ["occupied", "bg-blue-500", "Occupied"],
              ["reserved", "bg-amber-500", "Reserved"],
              ["cleaning", "bg-gray-400", "Needs Cleaning"],
            ].map(([k, c, l]) => (
              <div
                key={k}
                className="flex items-center gap-1.5 text-xs text-gray-600"
              >
                <span className={`h-3 w-3 rounded-sm ${c}`} />
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Service Requests */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-[#0f1f3d]">
              <span className="inline-block h-5 w-1 rounded-full bg-[#c9a84c]" />
              Service Requests
            </h2>
            <div className="scrollbar-thin max-h-52 space-y-3 overflow-y-auto">
              {serviceRequests
                .filter((r) => r.status !== "completed")
                .map((req) => (
                  <div
                    key={req.id}
                    className="rounded-xl border border-gray-100 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-[#0f1f3d]">
                          Room {req.room} · {req.type}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-gray-500">
                          {req.detail}
                        </div>
                      </div>
                      {req.priority === "high" && (
                        <span className="flex-shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-600">
                          URGENT
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${req.status === "requested" ? "bg-orange-100 text-orange-600" : req.status === "acknowledged" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}
                      >
                        ● {req.status.toUpperCase()}
                      </span>
                      {req.status === "requested" && (
                        <button
                          onClick={() => acknowledgeRequest(req.id)}
                          className="rounded-full bg-[#0f1f3d] px-2 py-0.5 text-[9px] text-white transition-colors hover:bg-[#162847]"
                        >
                          Acknowledge
                        </button>
                      )}
                      {req.status === "acknowledged" && (
                        <button
                          onClick={() => completeRequest(req.id)}
                          className="rounded-full bg-green-600 px-2 py-0.5 text-[9px] text-white transition-colors hover:bg-green-700"
                        >
                          Complete
                        </button>
                      )}
                      <span className="ml-auto text-[9px] text-gray-400">
                        {req.time}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Live Food Orders */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-[#0f1f3d]">
              <span className="inline-block h-5 w-1 rounded-full bg-[#c9a84c]" />
              Live Food Orders
            </h2>
            <div className="scrollbar-thin max-h-44 space-y-2 overflow-y-auto">
              {foodOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 border-b border-gray-50 py-2 last:border-0"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-sm">
                    🍽
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#0f1f3d]">
                      Room {order.room}
                    </div>
                    <div className="truncate text-[10px] text-gray-500">
                      {order.items}
                    </div>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${
                      order.status === "delivered"
                        ? "bg-green-100 text-green-600"
                        : order.status === "out-for-delivery"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {order.status === "out-for-delivery"
                      ? "OUT FOR DELIVERY"
                      : order.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Activity */}
          <div className="rounded-2xl bg-[#0f1f3d] p-5">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-white">
              <span className="inline-block h-5 w-1 rounded-full bg-[#c9a84c]" />
              Recent Activity
            </h2>
            <div className="space-y-2">
              {statsError ? (
                <div className="text-xs text-white/40">{statsError}</div>
              ) : recentActivity.length === 0 ? (
                <div className="text-xs text-white/40">
                  No recent activity yet.
                </div>
              ) : (
                recentActivity.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#c9a84c]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs text-white/80">
                        {a.text}
                      </div>
                      <div className="text-[10px] text-white/30">
                        {formatRelativeTime(a.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
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
