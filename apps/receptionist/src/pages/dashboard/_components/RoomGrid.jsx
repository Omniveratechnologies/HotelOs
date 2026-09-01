import React from "react";

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

const floors = [1, 2, 3];

export default function RoomGrid({ rooms, onSelectRoom }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs xl:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-navy-900 flex items-center gap-2 font-bold">
          <span className="bg-gold-400 inline-block h-5 w-1 rounded-full" />
          Room Grid — Tap a room to manage
        </h2>
      </div>
      <div className="space-y-4">
        {floors.map((floor) => (
          <div key={floor}>
            <div className="mb-2 text-xs font-semibold tracking-widest text-gray-400 uppercase">
              Floor {floor}
            </div>
            <div className="grid grid-cols-6 gap-2">
              {rooms
                .filter((r) => r.floor === floor)
                .map((room) => (
                  <button
                    key={room.id}
                    onClick={() => onSelectRoom(room)}
                    className={`cursor-pointer rounded-xl border-2 p-2 text-center transition-all hover:scale-105 hover:shadow-md ${statusColor[room.status]} ${statusBg[room.status]}`}
                  >
                    <div className="mb-1 text-4xl">🛏</div>
                    <div className="text-sm font-bold">{room.roomNumber}</div>
                    <div className="mt-0.5 text-[9px] font-semibold tracking-wide uppercase">
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
            <span className={`h-3 w-3 rounded-xs ${c}`} />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
