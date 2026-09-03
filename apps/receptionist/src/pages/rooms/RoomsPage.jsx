import React, { useState } from "react";
import RoomModal from "../../components/RoomModal.jsx";
import AddRoomModal from "./AddRoomModal.jsx";
import { useHotelOS } from "../../app/useHotelOS.js";

export default function RoomsPage() {
  const { rooms, updateRoomStatus, addRoom, roomsLoading, roomsError } =
    useHotelOS();
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = rooms.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (
      search &&
      !r.roomNumber.includes(search) &&
      !(r.guest && r.guest.toLowerCase().includes(search.toLowerCase()))
    )
      return false;
    return true;
  });

  const statusColor = {
    available: "bg-green-100 text-green-700",
    occupied: "bg-blue-100 text-blue-700",
    reserved: "bg-amber-100 text-amber-700",
    cleaning: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-navy-900 text-2xl font-bold">
            Room Management
          </h1>
          <p className="text-sm text-gray-500">
            {rooms.length} total rooms ·{" "}
            {rooms.filter((r) => r.status === "available").length} available
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-navy-900 hover:bg-navy-800 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          + Add Room
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search room or guest..."
          className="focus:border-gold-400 w-56 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-hidden"
        />
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {["all", "available", "occupied", "reserved", "cleaning"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${filter === s ? "text-navy-900 bg-white shadow-xs" : "text-gray-500 hover:text-gray-700"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="focus:border-gold-400 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-hidden"
        >
          <option value="all">All Types</option>
          <option>Standard</option>
          <option>Deluxe</option>
          <option>Suite</option>
        </select>
      </div>

      {/* Loading / Error */}
      {roomsLoading && (
        <div className="py-16 text-center text-sm text-gray-400">
          Loading rooms...
        </div>
      )}
      {!roomsLoading && roomsError && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {roomsError}
        </div>
      )}

      {/* Empty state */}
      {!roomsLoading && !roomsError && filtered.length === 0 && (
        <div className="py-16 text-center text-sm text-gray-400">
          No rooms found. Create your first room with “+ Add Room”.
        </div>
      )}

      {/* Room Cards */}
      {!roomsLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {filtered.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelected(room)}
              className="rounded-2xl border border-gray-100 bg-white p-4 text-left transition-all hover:scale-105 hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-navy-900 text-2xl font-bold">
                  {room.roomNumber}
                </span>
                <span className="text-xl">🛏</span>
              </div>
              <div className="mb-2 text-xs text-gray-500">{room.type}</div>
              <div
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor[room.status]}`}
              >
                {room.status.toUpperCase()}
              </div>
              {room.guest && (
                <div className="mt-2 truncate text-xs font-medium text-gray-600">
                  {room.guest}
                </div>
              )}
              {room.checkOut && (
                <div className="mt-0.5 text-[10px] text-gray-400">
                  Out: {room.checkOut}
                </div>
              )}
              <div className="text-gold-400 mt-2 text-xs font-semibold">
                ₹{room.rate}/night
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <RoomModal
          room={selected}
          onClose={() => setSelected(null)}
          updateRoomStatus={updateRoomStatus}
        />
      )}
      {showAdd && (
        <AddRoomModal onClose={() => setShowAdd(false)} onAdd={addRoom} />
      )}
    </div>
  );
}
