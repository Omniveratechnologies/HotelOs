import React, { useMemo, useState } from "react";
import { BedDouble, User, Search, Layers, AlertCircle } from "lucide-react";

const STATUS_CONFIG = {
  available: {
    label: "Available",
    variant: "confirmed",
    bg: "bg-emerald-50/50 hover:bg-emerald-50",
    border: "border-emerald-200 hover:border-emerald-400",
    text: "text-emerald-700",
    indicator: "bg-emerald-500",
  },
  occupied: {
    label: "Occupied",
    variant: "checked-in",
    bg: "bg-blue-50/50 hover:bg-blue-50",
    border: "border-blue-200 hover:border-blue-400",
    text: "text-blue-700",
    indicator: "bg-blue-500",
  },
  reserved: {
    label: "Reserved",
    variant: "pending",
    bg: "bg-amber-50/50 hover:bg-amber-50",
    border: "border-amber-200 hover:border-amber-400",
    text: "text-amber-700",
    indicator: "bg-amber-500",
  },
  cleaning: {
    label: "Cleaning",
    variant: "neutral",
    bg: "bg-gray-50/70 hover:bg-gray-100/70",
    border: "border-gray-200 hover:border-gray-300",
    text: "text-gray-600",
    indicator: "bg-gray-400",
  },
  maintenance: {
    label: "Maintenance",
    variant: "cancelled",
    bg: "bg-rose-50/50 hover:bg-rose-50",
    border: "border-rose-200 hover:border-rose-400",
    text: "text-rose-700",
    indicator: "bg-rose-500",
  },
};

export default function RoomGrid({ rooms = [], onSelectRoom }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Extract unique floors sorted ascending
  const floors = useMemo(() => {
    const set = new Set();
    rooms.forEach((r) => {
      if (r.floor !== undefined && r.floor !== null) {
        set.add(Number(r.floor));
      } else {
        const parsed = parseInt(String(r.roomNumber)[0], 10);
        set.add(isNaN(parsed) ? 1 : parsed);
      }
    });
    const arr = Array.from(set).sort((a, b) => a - b);
    return arr.length > 0 ? arr : [1];
  }, [rooms]);

  // Counts by status
  const counts = useMemo(() => {
    return {
      all: rooms.length,
      available: rooms.filter((r) => r.status === "available").length,
      occupied: rooms.filter((r) => r.status === "occupied").length,
      reserved: rooms.filter((r) => r.status === "reserved").length,
      cleaning: rooms.filter((r) => r.status === "cleaning").length,
    };
  }, [rooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rooms.filter((r) => {
      // Status filter
      if (statusFilter !== "all" && r.status !== statusFilter) return false;

      // Floor filter
      const roomFloor =
        r.floor !== undefined && r.floor !== null
          ? Number(r.floor)
          : parseInt(String(r.roomNumber)[0], 10) || 1;
      if (floorFilter !== "all" && roomFloor !== Number(floorFilter)) {
        return false;
      }

      // Search filter
      if (q) {
        const numMatch = String(r.roomNumber || "")
          .toLowerCase()
          .includes(q);
        const typeMatch = String(r.type || "")
          .toLowerCase()
          .includes(q);
        const guestMatch = String(r.guest || "")
          .toLowerCase()
          .includes(q);
        if (!numMatch && !typeMatch && !guestMatch) return false;
      }

      return true;
    });
  }, [rooms, statusFilter, floorFilter, search]);

  // Floors present in current filtered set
  const activeFloors = useMemo(() => {
    if (floorFilter !== "all") return [Number(floorFilter)];
    const set = new Set();
    filteredRooms.forEach((r) => {
      const roomFloor =
        r.floor !== undefined && r.floor !== null
          ? Number(r.floor)
          : parseInt(String(r.roomNumber)[0], 10) || 1;
      set.add(roomFloor);
    });
    const arr = Array.from(set).sort((a, b) => a - b);
    return arr.length > 0 ? arr : floors;
  }, [filteredRooms, floorFilter, floors]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs xl:col-span-2">
      {/* Top Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-brand-900 flex items-center gap-2 text-base font-bold">
            <span className="bg-primary-500 inline-block h-5 w-1.5 rounded-full" />
            Room Grid
            <span className="text-xs font-normal text-gray-500">
              — Tap a room to manage
            </span>
          </h2>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Room or guest..."
            className="focus:border-brand-500 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-1.5 pr-3 pl-8 text-xs outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "all", label: "All", count: counts.all },
            { key: "available", label: "Available", count: counts.available },
            { key: "occupied", label: "Occupied", count: counts.occupied },
            { key: "reserved", label: "Reserved", count: counts.reserved },
            { key: "cleaning", label: "Cleaning", count: counts.cleaning },
          ].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  active
                    ? "bg-brand-900 text-white shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                }`}
              >
                {tab.label}
                <span
                  className={`py-0.2 ml-1.5 rounded-full px-1.5 text-[10px] ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Floor selector */}
        {floors.length > 1 && (
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 text-xs">
            <Layers className="ml-1 h-3.5 w-3.5 text-gray-400" />
            <button
              onClick={() => setFloorFilter("all")}
              className={`cursor-pointer rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                floorFilter === "all"
                  ? "text-brand-900 bg-white font-semibold shadow-2xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              All
            </button>
            {floors.map((fl) => (
              <button
                key={fl}
                onClick={() => setFloorFilter(fl)}
                className={`cursor-pointer rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                  floorFilter === fl
                    ? "text-brand-900 bg-white font-semibold shadow-2xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                F{fl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid Content */}
      {filteredRooms.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-gray-600">
            No rooms match your filter criteria.
          </p>
          {(statusFilter !== "all" || floorFilter !== "all" || search) && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setFloorFilter("all");
                setSearch("");
              }}
              className="text-brand-600 mt-2 text-xs font-semibold hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {activeFloors.map((floor) => {
            const floorRooms = filteredRooms.filter((r) => {
              const rFloor =
                r.floor !== undefined && r.floor !== null
                  ? Number(r.floor)
                  : parseInt(String(r.roomNumber)[0], 10) || 1;
              return rFloor === floor;
            });

            if (floorRooms.length === 0) return null;

            return (
              <div key={floor}>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  <span>Floor {floor}</span>
                  <span className="text-[11px] font-normal text-gray-400 lowercase">
                    {floorRooms.length}{" "}
                    {floorRooms.length === 1 ? "room" : "rooms"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {floorRooms.map((room) => {
                    const cfg =
                      STATUS_CONFIG[room.status] || STATUS_CONFIG.cleaning;

                    return (
                      <button
                        key={room.id}
                        onClick={() => onSelectRoom(room)}
                        className={`group relative flex cursor-pointer flex-col justify-between rounded-xl border p-2.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${cfg.border} ${cfg.bg}`}
                      >
                        {/* Status dot / tag */}
                        <div className="flex w-full items-center justify-between gap-1">
                          <span className="font-display text-brand-900 group-hover:text-primary-600 text-base font-bold transition-colors">
                            {room.roomNumber}
                          </span>
                          <span
                            className={`h-2 w-2 rounded-full ${cfg.indicator}`}
                            title={cfg.label}
                          />
                        </div>

                        {/* Room type & icon */}
                        <div className="my-1.5 flex items-center justify-between text-xs text-gray-500">
                          <span className="truncate text-[11px] font-medium text-gray-600">
                            {room.type}
                          </span>
                          <BedDouble className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        </div>

                        {/* Bottom dynamic details */}
                        <div className="min-w-0 border-t border-black/5 pt-1.5">
                          {room.status === "occupied" && room.guest ? (
                            <div className="flex items-center gap-1 truncate text-[11px] font-semibold text-blue-800">
                              <User className="h-3 w-3 shrink-0" />
                              <span className="truncate">{room.guest}</span>
                            </div>
                          ) : room.status === "reserved" && room.guest ? (
                            <div className="flex items-center gap-1 truncate text-[11px] font-semibold text-amber-800">
                              <User className="h-3 w-3 shrink-0" />
                              <span className="truncate">{room.guest}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] font-semibold text-gray-700">
                              ₹{Number(room.rate || 0).toLocaleString()}
                            </div>
                          )}

                          <div className="mt-0.5 flex items-center justify-between text-[10px] text-gray-400">
                            <span className="font-medium tracking-wide uppercase">
                              {cfg.label}
                            </span>
                            {room.checkOut && room.status === "occupied" && (
                              <span>Out: {room.checkOut.slice(5)}</span>
                            )}
                          </div>
                        </div>

                        {/* Under review badge */}
                        {room.roomCode &&
                          room.channelSyncStatus === "under_review" && (
                            <div className="mt-1 w-full rounded bg-purple-100 py-0.5 text-center text-[9px] font-bold text-purple-700">
                              REVIEW
                            </div>
                          )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <div className="flex flex-wrap gap-3.5">
          {[
            { key: "available", color: "bg-emerald-500", label: "Available" },
            { key: "occupied", color: "bg-blue-500", label: "Occupied" },
            { key: "reserved", color: "bg-amber-500", label: "Reserved" },
            { key: "cleaning", color: "bg-gray-400", label: "Needs Cleaning" },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-1.5 text-xs text-gray-600"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <span className="text-[11px] text-gray-400">
          Total Rooms: {rooms.length}
        </span>
      </div>
    </div>
  );
}
