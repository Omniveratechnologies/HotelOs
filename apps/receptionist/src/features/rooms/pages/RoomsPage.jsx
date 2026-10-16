import React, { useMemo, useState } from "react";
import {
  BedDouble,
  User,
  Plus,
  Search,
  CheckCircle2,
  Sparkles,
  Calendar,
  Layers,
  X,
} from "lucide-react";
import {
  Header,
  KpiTile,
  KpiTileRow,
  StatusChip,
  Button,
  EmptyState,
  InlineBanner,
} from "@hotelos/ui/components";
import RoomModal from "../components/RoomModal.jsx";
import AddRoomModal from "../components/AddRoomModal.jsx";
import { useHotelOS } from "../../../hooks/useHotelOS.js";

const STATUS_CONFIG = {
  available: {
    label: "Available",
    variant: "confirmed",
    border: "border-emerald-200 hover:border-emerald-400",
    bg: "bg-emerald-50/40 hover:bg-emerald-50",
    indicator: "bg-emerald-500",
  },
  occupied: {
    label: "Occupied",
    variant: "checked-in",
    border: "border-blue-200 hover:border-blue-400",
    bg: "bg-blue-50/40 hover:bg-blue-50",
    indicator: "bg-blue-500",
  },
  reserved: {
    label: "Reserved",
    variant: "pending",
    border: "border-amber-200 hover:border-amber-400",
    bg: "bg-amber-50/40 hover:bg-amber-50",
    indicator: "bg-amber-500",
  },
  cleaning: {
    label: "Needs Cleaning",
    variant: "neutral",
    border: "border-gray-200 hover:border-gray-300",
    bg: "bg-gray-50/60 hover:bg-gray-100/60",
    indicator: "bg-gray-400",
  },
  maintenance: {
    label: "Maintenance",
    variant: "cancelled",
    border: "border-rose-200 hover:border-rose-400",
    bg: "bg-rose-50/40 hover:bg-rose-50",
    indicator: "bg-rose-500",
  },
};

export default function RoomsPage() {
  const {
    rooms = [],
    updateRoomStatus,
    updateRoom,
    addRoom,
    roomsLoading,
    roomsError,
  } = useHotelOS();

  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [groupByFloor, setGroupByFloor] = useState(true);

  // Status counts
  const availableCount = useMemo(
    () => rooms.filter((r) => r.status === "available").length,
    [rooms],
  );
  const occupiedCount = useMemo(
    () => rooms.filter((r) => r.status === "occupied").length,
    [rooms],
  );
  const reservedCount = useMemo(
    () => rooms.filter((r) => r.status === "reserved").length,
    [rooms],
  );
  const cleaningCount = useMemo(
    () => rooms.filter((r) => r.status === "cleaning").length,
    [rooms],
  );

  // Available room types
  const roomTypes = useMemo(() => {
    const set = new Set();
    rooms.forEach((r) => {
      if (r.type) set.add(r.type);
    });
    return Array.from(set).sort();
  }, [rooms]);

  // Available floors
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

  // Filtered rooms
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rooms.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;

      const roomFloor =
        r.floor !== undefined && r.floor !== null
          ? Number(r.floor)
          : parseInt(String(r.roomNumber)[0], 10) || 1;
      if (floorFilter !== "all" && roomFloor !== Number(floorFilter)) {
        return false;
      }

      if (q) {
        const matchNum = String(r.roomNumber || "")
          .toLowerCase()
          .includes(q);
        const matchType = String(r.type || "")
          .toLowerCase()
          .includes(q);
        const matchGuest = String(r.guest || "")
          .toLowerCase()
          .includes(q);
        if (!matchNum && !matchType && !matchGuest) return false;
      }

      return true;
    });
  }, [rooms, statusFilter, typeFilter, floorFilter, search]);

  const hasActiveFilters =
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    floorFilter !== "all" ||
    search.trim().length > 0;

  const handleClearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setFloorFilter("all");
    setSearch("");
  };

  return (
    <>
      <Header
        pageTitle="Room Inventory & Operations"
        pageDescription={`${rooms.length} total rooms • ${availableCount} ready for check-in • ${occupiedCount} currently occupied`}
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setShowAdd(true)}
          className="shadow-2xs"
        >
          Add Room
        </Button>
      </Header>

      <div className="space-y-6 p-6">
        {/* KPI Tiles */}
        <KpiTileRow>
          <KpiTile
            icon={BedDouble}
            iconClassName="bg-gray-100 text-gray-700"
            label="Total Rooms"
            value={rooms.length}
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          <KpiTile
            icon={CheckCircle2}
            iconClassName="bg-emerald-50 text-emerald-700"
            label="Available"
            value={availableCount}
            delta={`${Math.round((availableCount / (rooms.length || 1)) * 100)}% available`}
            deltaTone="up"
            active={statusFilter === "available"}
            onClick={() =>
              setStatusFilter((prev) =>
                prev === "available" ? "all" : "available",
              )
            }
          />
          <KpiTile
            icon={User}
            iconClassName="bg-blue-50 text-blue-700"
            label="Occupied"
            value={occupiedCount}
            delta={`${Math.round((occupiedCount / (rooms.length || 1)) * 100)}% occupancy`}
            deltaTone="neutral"
            active={statusFilter === "occupied"}
            onClick={() =>
              setStatusFilter((prev) =>
                prev === "occupied" ? "all" : "occupied",
              )
            }
          />
          <KpiTile
            icon={Calendar}
            iconClassName="bg-amber-50 text-amber-700"
            label="Reserved"
            value={reservedCount}
            active={statusFilter === "reserved"}
            onClick={() =>
              setStatusFilter((prev) =>
                prev === "reserved" ? "all" : "reserved",
              )
            }
          />
          <KpiTile
            icon={Sparkles}
            iconClassName="bg-gray-100 text-gray-600"
            label="Needs Cleaning"
            value={cleaningCount}
            active={statusFilter === "cleaning"}
            onClick={() =>
              setStatusFilter((prev) =>
                prev === "cleaning" ? "all" : "cleaning",
              )
            }
          />
        </KpiTileRow>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search room # or guest..."
                className="focus:border-brand-500 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pr-3 pl-9 text-sm transition outline-none focus:bg-white"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Room Type select */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="focus:border-brand-500 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none"
            >
              <option value="all">All Room Types</option>
              {roomTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Floor select */}
            {floors.length > 1 && (
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="focus:border-brand-500 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none"
              >
                <option value="all">All Floors</option>
                {floors.map((fl) => (
                  <option key={fl} value={fl}>
                    Floor {fl}
                  </option>
                ))}
              </select>
            )}

            {/* Clear button if active */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                icon={X}
                onClick={handleClearFilters}
                className="text-gray-500 hover:text-gray-800"
              >
                Reset Filters
              </Button>
            )}
          </div>

          {/* Group by floor toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Group by Floor:</span>
            <button
              onClick={() => setGroupByFloor(!groupByFloor)}
              className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors ${
                groupByFloor ? "bg-brand-900" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  groupByFloor ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Error notification */}
        {roomsError && (
          <InlineBanner variant="error">{roomsError}</InlineBanner>
        )}

        {/* Loading state */}
        {roomsLoading && (
          <div className="py-20 text-center">
            <div className="border-brand-900 mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
            <p className="text-sm text-gray-500">Loading hotel inventory...</p>
          </div>
        )}

        {/* Empty state */}
        {!roomsLoading && filtered.length === 0 && (
          <EmptyState
            icon={BedDouble}
            title={
              hasActiveFilters
                ? "No matching rooms found"
                : "No rooms configured"
            }
            hint={
              hasActiveFilters
                ? "Try adjusting your search query, status, or floor filter."
                : "Get started by adding your property's first guest room."
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" onClick={handleClearFilters}>
                  Clear All Filters
                </Button>
              ) : (
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => setShowAdd(true)}
                >
                  Add First Room
                </Button>
              )
            }
          />
        )}

        {/* Room Cards Grid */}
        {!roomsLoading && filtered.length > 0 && (
          <div>
            {groupByFloor ? (
              <div className="space-y-6">
                {floors.map((fl) => {
                  const floorRooms = filtered.filter((r) => {
                    const roomFloor =
                      r.floor !== undefined && r.floor !== null
                        ? Number(r.floor)
                        : parseInt(String(r.roomNumber)[0], 10) || 1;
                    return roomFloor === fl;
                  });

                  if (floorRooms.length === 0) return null;

                  return (
                    <div
                      key={fl}
                      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs"
                    >
                      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Layers className="text-brand-700 h-4 w-4" />
                          <h3 className="font-display text-brand-900 text-sm font-bold tracking-wider uppercase">
                            Floor {fl}
                          </h3>
                        </div>
                        <span className="text-xs font-medium text-gray-400">
                          {floorRooms.length}{" "}
                          {floorRooms.length === 1 ? "room" : "rooms"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                        {floorRooms.map((room) =>
                          renderRoomCard(room, setSelected),
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {filtered.map((room) => renderRoomCard(room, setSelected))}
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        {selected && (
          <RoomModal
            room={selected}
            onClose={() => setSelected(null)}
            updateRoomStatus={updateRoomStatus}
            updateRoom={updateRoom}
          />
        )}

        {showAdd && (
          <AddRoomModal onClose={() => setShowAdd(false)} onAdd={addRoom} />
        )}
      </div>
    </>
  );
}

function renderRoomCard(room, onSelect) {
  const cfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.cleaning;

  return (
    <button
      key={room.id}
      onClick={() => onSelect(room)}
      className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-150 hover:-translate-y-1 hover:shadow-md ${cfg.border} ${cfg.bg}`}
    >
      <div>
        {/* Top Header: Room Number & Bed icon */}
        <div className="flex items-center justify-between">
          <span className="font-display text-brand-900 group-hover:text-primary-600 text-2xl font-bold transition-colors">
            {room.roomNumber}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 shadow-2xs">
            <BedDouble className="h-4 w-4 text-gray-600" />
          </div>
        </div>

        {/* Type & Floor */}
        <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
          <span className="font-medium text-gray-700">{room.type}</span>
          <span>F{room.floor || 1}</span>
        </div>

        {/* Status Chip */}
        <div className="mt-2.5">
          <StatusChip variant={cfg.variant}>{cfg.label}</StatusChip>
        </div>

        {/* Channel Review Tag */}
        {room.roomCode && room.channelSyncStatus === "under_review" && (
          <div className="mt-1.5 inline-block rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
            UNDER REVIEW
          </div>
        )}
      </div>

      {/* Guest / Pricing Footer */}
      <div className="mt-4 border-t border-black/5 pt-2.5">
        {room.guest ? (
          <div className="min-w-0">
            <div className="text-brand-900 flex items-center gap-1 truncate text-xs font-semibold">
              <User className="h-3 w-3 shrink-0 text-gray-500" />
              <span className="truncate">{room.guest}</span>
            </div>
            {room.checkOut && (
              <div className="mt-0.5 text-[11px] text-gray-500">
                Out: {room.checkOut}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-400">No active guest</div>
        )}

        <div className="text-brand-900 mt-2 flex items-center justify-between text-xs font-bold">
          <span>₹{Number(room.rate || 0).toLocaleString()}</span>
          <span className="text-[10px] font-normal text-gray-400">/night</span>
        </div>
      </div>
    </button>
  );
}
