import { useEffect, useState } from "react";
import { SidebarToggle } from "@hotelos/ui/components/SidebarToggle";

import ChannelStatusBadge from "../../components/ChannelStatusBadge.jsx";
import RoomTypeFormModal from "../../components/room-types/RoomTypeFormModal.jsx";

import {
  getRoomTypes,
  deleteRoomType,
} from "../../services/roomType.service.js";

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");
  const [removing, setRemoving] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getRoomTypes();

        if (!cancelled) {
          setRoomTypes(data);
          setLoadError("");
        }
      } catch (error) {
        console.error("Failed to load room types:", error);

        if (!cancelled) {
          setLoadError(error.message || "Failed to load room types");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = roomTypes.filter((roomType) => {
    const q = search.trim().toLowerCase();

    if (!q) return true;

    return (
      String(roomType.roomCode || "")
        .toLowerCase()
        .includes(q) ||
      String(roomType.name || "")
        .toLowerCase()
        .includes(q) ||
      String(roomType.description || "")
        .toLowerCase()
        .includes(q)
    );
  });

  async function handleDelete(roomType) {
    if (!window.confirm(`Delete room type ${roomType.name}?`)) return;

    setRemoving(roomType.id);

    try {
      await deleteRoomType(roomType.id);

      setRoomTypes((previous) =>
        previous.filter((item) => item.id !== roomType.id),
      );
      setToast(`Room type ${roomType.name} deleted.`);
    } catch (error) {
      console.error("Delete room type error:", error);
      setToast(error.message || "Failed to delete room type.");
    } finally {
      setRemoving("");
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* TOPBAR */}
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-gray-100 bg-white/95 px-6 backdrop-blur-sm lg:px-10">
        <div className="flex min-w-0 items-center gap-4">
          <SidebarToggle />

          <div className="min-w-0">
            <h1 className="font-display text-brand-900 truncate text-2xl font-semibold">
              Room Types
            </h1>

            <p className="hidden text-sm text-gray-500 sm:block">
              Room types map your rooms to the property's room codes.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="bg-primary-400 hover:bg-primary-500 inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Add Room Type
        </button>
      </header>

      <main className="px-6 py-8 lg:px-10">
        {toast && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {toast}

            <button
              type="button"
              className="ml-4 font-semibold"
              onClick={() => setToast("")}
            >
              OK
            </button>
          </div>
        )}

        {/* CHANNEL NOTE */}
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          New or edited room types are <strong>Under review</strong> until a
          super admin makes the change in the property and verifies it. Once the
          count and details match, the type shows <strong>Synced</strong>.
        </div>

        {loadError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {loadError}
          </div>
        )}

        {/* TOOLBAR */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-xs">
            <svg
              className="text-brand-900/40 absolute top-1/2 left-3.5 -translate-y-1/2"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            <input
              className="text-brand-900 focus:ring-primary-400 w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-4 pl-10 text-sm outline-hidden focus:ring-2"
              placeholder="Search room types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <span className="text-brand-900/60 text-sm">
            {filtered.length} of {roomTypes.length} room types
          </span>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="text-brand-900/50 border-b border-gray-100 text-xs font-semibold tracking-wider uppercase">
                  <th className="px-6 py-3.5">Room type</th>
                  <th className="px-6 py-3.5">Room code</th>
                  <th className="px-6 py-3.5">Count</th>
                  <th className="px-6 py-3.5">Occupancy</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Channel</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-brand-900/60 px-6 py-10 text-center"
                    >
                      Loading room types...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-brand-900/60 px-6 py-10 text-center"
                    >
                      {roomTypes.length === 0
                        ? "No room types yet. Add your first room type to get started."
                        : "No room types match your search."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((roomType) => (
                    <tr key={roomType.id} className="hover:bg-gray-50/70">
                      <td className="px-6 py-4">
                        <p className="font-display text-brand-900 font-semibold">
                          {roomType.name}
                        </p>
                        {roomType.description ? (
                          <p className="text-xs text-gray-500">
                            {roomType.description}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-700">
                          {roomType.roomCode}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-brand-900 font-medium">
                          {roomType.count}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {roomType.minOccupancy}
                        {roomType.maxOccupancy != null
                          ? ` – ${roomType.maxOccupancy}`
                          : "+"}
                        <span className="text-gray-400"> guests</span>
                      </td>

                      <td className="px-6 py-4">
                        {roomType.active ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <ChannelStatusBadge
                          status={roomType.channelSyncStatus}
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(roomType);
                              setFormOpen(true);
                            }}
                            className="text-primary-400 hover:text-primary-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(roomType)}
                            disabled={removing === roomType.id}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {removing === roomType.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {formOpen && (
        <RoomTypeFormModal
          roomType={editing}
          onClose={() => setFormOpen(false)}
          onSaved={(saved) => {
            setRoomTypes((previous) => {
              const exists = previous.some((item) => item.id === saved.id);

              if (exists) {
                return previous.map((item) =>
                  item.id === saved.id ? saved : item,
                );
              }

              return [...previous, saved];
            });

            setToast(editing ? "Room type updated." : "Room type added.");
          }}
        />
      )}
    </div>
  );
}
