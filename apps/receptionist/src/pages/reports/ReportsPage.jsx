import React from "react";
import { useHotelOS } from "../../app/providers.jsx";

const ROOM_TYPES = ["Standard", "Deluxe", "Suite"];

export default function ReportsPage() {
  const { rooms, guests, foodOrders, serviceRequests, stats } = useHotelOS();

  const occupied = rooms.filter((r) => r.status === "occupied");
  const available = rooms.filter((r) => r.status === "available");
  const reserved = rooms.filter((r) => r.status === "reserved");
  const cleaning = rooms.filter((r) => r.status === "cleaning");
  const total = rooms.length;
  const occupancyRate =
    total > 0 ? Math.round((occupied.length / total) * 100) : 0;

  const roomRevenue = occupied.reduce((sum, r) => sum + r.rate, 0);
  const foodRevenue = foodOrders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.amount, 0);
  const avgDailyRate =
    occupied.length > 0 ? Math.round(roomRevenue / occupied.length) : 0;

  const byType = ROOM_TYPES.map((type) => {
    const occ = occupied.filter((r) => r.type === type);
    const totalInType = rooms.filter((r) => r.type === type).length;
    return {
      type,
      total: totalInType,
      occupied: occ.length,
      avgRate:
        occ.length > 0
          ? Math.round(occ.reduce((sum, r) => sum + r.rate, 0) / occ.length)
          : 0,
      revenue: occ.reduce((sum, r) => sum + r.rate, 0),
    };
  });

  const checkedInGuests = guests.filter((g) => g.status === "checked-in");
  const reservedGuests = guests.filter((g) => g.status === "reserved");
  const checkedOutGuests = guests.filter((g) => g.status === "checked-out");

  const hotelName = stats?.hotelName || "your hotel";
  const reportDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0f1f3d]">
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500">
            Live snapshot · {reportDate} · {hotelName}
          </p>
        </div>
        <button className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
          Export PDF
        </button>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Occupancy Rate",
            value: `${occupancyRate}%`,
            sub: `${occupied.length}/${total} rooms`,
            color: "text-blue-600",
            bg: "bg-blue-50",
            icon: "🏨",
          },
          {
            label: "Room Revenue",
            value: `₹${roomRevenue.toLocaleString()}`,
            sub: `${occupied.length} occupied rooms`,
            color: "text-green-600",
            bg: "bg-green-50",
            icon: "💰",
          },
          {
            label: "F&B Revenue",
            value: `₹${foodRevenue.toLocaleString()}`,
            sub: `${foodOrders.filter((o) => o.status === "delivered").length} delivered orders`,
            color: "text-purple-600",
            bg: "bg-purple-50",
            icon: "🍽️",
          },
          {
            label: "Avg Daily Rate",
            value: `₹${avgDailyRate.toLocaleString()}`,
            sub: "Per occupied room",
            color: "text-[#c9a84c]",
            bg: "bg-amber-50",
            icon: "📊",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div
              className={`h-10 w-10 ${k.bg} mb-3 flex items-center justify-center rounded-xl text-xl`}
            >
              {k.icon}
            </div>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="mt-0.5 text-sm font-medium text-gray-700">
              {k.label}
            </div>
            <div className="mt-0.5 text-xs text-gray-400">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Room Mix by Type */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-bold text-[#0f1f3d]">Current Room Mix</h3>
          <div className="space-y-4">
            {byType.map((t) => (
              <div key={t.type}>
                <div className="mb-1.5 flex justify-between">
                  <span className="text-sm font-semibold text-[#0f1f3d]">
                    {t.type}
                  </span>
                  <span className="text-sm text-gray-500">
                    {t.occupied}/{t.total} occupied · ₹{t.avgRate}/night
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${t.occupied > 0 ? "bg-gradient-to-r from-[#0f1f3d] to-[#1e3a5f]" : "bg-gray-200"}`}
                    style={{
                      width: `${total > 0 ? (t.total / total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {rooms.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-400">
              No rooms yet. Create rooms to see the mix.
            </div>
          )}
        </div>

        {/* Room Status Donut */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-bold text-[#0f1f3d]">Current Room Status</h3>
          {total === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              No rooms yet.
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="relative h-36 w-36 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3.5"
                    strokeDasharray={`${(available.length / total) * 100} ${100 - (available.length / total) * 100}`}
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3.5"
                    strokeDasharray={`${(occupied.length / total) * 100} ${100 - (occupied.length / total) * 100}`}
                    strokeDashoffset={`${-(available.length / total) * 100}`}
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                    strokeDasharray={`${(reserved.length / total) * 100} ${100 - (reserved.length / total) * 100}`}
                    strokeDashoffset={`${-((available.length + occupied.length) / total) * 100}`}
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="3.5"
                    strokeDasharray={`${(cleaning.length / total) * 100} ${100 - (cleaning.length / total) * 100}`}
                    strokeDashoffset={`${-((available.length + occupied.length + reserved.length) / total) * 100}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#0f1f3d]">
                      {occupancyRate}%
                    </div>
                    <div className="text-xs text-gray-400">Occupied</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  ["bg-green-500", "Available", available.length],
                  ["bg-blue-500", "Occupied", occupied.length],
                  ["bg-amber-500", "Reserved", reserved.length],
                  ["bg-gray-400", "Cleaning", cleaning.length],
                ].map(([c, l, n]) => (
                  <div key={l} className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${c} flex-shrink-0`}
                    />
                    <div>
                      <div className="text-sm font-semibold text-[#0f1f3d]">
                        {n} rooms
                      </div>
                      <div className="text-xs text-gray-400">{l}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guest Status */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
            Checked In
          </div>
          <div className="text-3xl font-bold text-[#0f1f3d]">
            {checkedInGuests.length}
          </div>
          <div className="mt-1 text-sm text-gray-400">
            {checkedInGuests
              .slice(0, 3)
              .map((g) => g.name)
              .join(" · ") || "No guests in-house"}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
            Upcoming Reservations
          </div>
          <div className="text-3xl font-bold text-[#0f1f3d]">
            {reservedGuests.length}
          </div>
          <div className="mt-1 text-sm text-gray-400">
            {reservedGuests
              .slice(0, 3)
              .map((g) => g.name)
              .join(" · ") || "No upcoming reservations"}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Total Guests Registered
          </div>
          <div className="text-3xl font-bold text-[#0f1f3d]">
            {guests.length}
          </div>
          <div className="mt-1 text-sm text-gray-400">
            {checkedOutGuests.length} checked out so far
          </div>
        </div>
      </div>

      {/* Revenue by Room Type */}
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-[#0f1f3d]">Revenue by Room Type</h3>
        {total === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">
            No rooms yet.
          </div>
        ) : (
          <div className="space-y-4">
            {byType.map((t) => {
              const rev = t.revenue;
              const pct = roomRevenue > 0 ? (rev / roomRevenue) * 100 : 0;
              return (
                <div key={t.type}>
                  <div className="mb-1.5 flex justify-between">
                    <span className="text-sm font-medium text-[#0f1f3d]">
                      {t.type}{" "}
                      <span className="font-normal text-gray-400">
                        ({t.occupied} rooms · ₹{t.avgRate}/night avg)
                      </span>
                    </span>
                    <span className="text-sm font-bold text-[#0f1f3d]">
                      ₹{rev.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0f1f3d] to-[#1e3a5f] transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-0.5 text-xs text-gray-400">
                    {Math.round(pct)}% of room revenue
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Service Metrics */}
      <div className="rounded-2xl bg-[#0f1f3d] p-5">
        <h3 className="mb-4 font-bold text-white">Service Performance</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ["Total Requests", serviceRequests.length, "text-white"],
            [
              "Pending",
              serviceRequests.filter((r) => r.status === "requested").length,
              "text-orange-400",
            ],
            [
              "Acknowledged",
              serviceRequests.filter((r) => r.status === "acknowledged").length,
              "text-yellow-400",
            ],
            [
              "In Progress",
              serviceRequests.filter((r) => r.status === "in-progress").length,
              "text-blue-400",
            ],
            [
              "Completed",
              serviceRequests.filter((r) => r.status === "completed").length,
              "text-green-400",
            ],
          ].map(([l, v, c]) => (
            <div key={l} className="rounded-xl bg-white/5 p-3 text-center">
              <div className={`text-3xl font-bold ${c}`}>{v}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-white/50">
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
