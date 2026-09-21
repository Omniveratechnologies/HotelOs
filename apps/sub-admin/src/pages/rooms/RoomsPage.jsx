import { useEffect, useState } from "react";
import { Header } from "@hotelos/ui/components/Header";

import ChannelStatusBadge from "../../components/ChannelStatusBadge.jsx";
import RoomFormModal from "../../components/rooms/RoomFormModal.jsx";

import { getRooms, deleteRoom } from "../../services/room.service.js";

const statusPill = (status) => {
  if (status === "available") {
    return "border emerald";
  }

  if (status === "occupied") return "bg-red-50 text-red-700 border-red-200";

  if (status === "reserved") return "bg-blue-50 text-blue-700 border-blue-200";

  if (status === "cleaning")
    return "bg-amber-50 text-amber-700 border-amber-200";

  return "bg-gray-50 text-gray-600 border-gray-200";
};

const statusLabel = (status) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const roomTypeColor = {
  Standard: "bg-indigo-50 text-indigo-700",
  Deluxe: "bg-violet-50 text-violet-700",
  Suite: "bg-fuchsia-50 text-fuchsia-700",
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
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
        const data = await getRooms();

        if (!cancelled) {
          setRooms(data);
          setLoadError("");
        }
      } catch (error) {
        console.error("Failed to load rooms:", error);

        if (!cancelled) {
          setLoadError(error.message || "Failed to load rooms");
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

  const filtered = rooms.filter((room) => {
    const q = search.trim().toLowerCase();

    if (!q) return true;

    return (
      String(room.roomNumber).toLowerCase().includes(q) ||
      String(room.roomCode || "")
        .toLowerCase()
        .includes(q) ||
      String(room.type).toLowerCase().includes(q)
    );
  });

  async function handleDelete(room) {
    if (!window.confirm(`Delete room ${room.roomNumber}?`)) return;

    setRemoving(room.id);

    try {
      const updated = await deleteRoom(room.id);

      setRooms((previous) =>
        previous.map((item) => (item.id === room.id ? updated : item)),
      );

      setToast(
        updated.pendingDelete
          ? `Delete request queued — the room will be removed once a super admin reduces the room count in Aiosell and verifies.`
          : `Room ${room.roomNumber} deleted.`,
      );
    } catch (error) {
      console.error("Delete room error:", error);
      setToast(error.message || "Failed to delete room.");
    } finally {
      setRemoving("");
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* TOPBAR */}
      <Header
        pageTitle="Rooms"
        pageDescription="Manage your property's rooms and channel codes."
      >
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
          Add Room
        </button>
      </Header>

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
          Rooms that map to the property are <strong>Under review</strong> until
          a super admin makes the change in the property and verifies it. Once
          verified the room shows <strong>Synced</strong>.
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
              placeholder="Search rooms or codes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <span className="text-brand-900/60 text-sm">
            {filtered.length} of {rooms.length} rooms
          </span>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead>
                <tr className="text-brand-900/50 border-b border-gray-100 text-xs font-semibold tracking-wider uppercase">
                  <th className="px-6 py-3.5">Room</th>
                  <th className="px-6 py-3.5">Room code</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Rate</th>
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
                      Loading rooms...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-brand-900/60 px-6 py-10 text-center"
                    >
                      {rooms.length === 0
                        ? "No rooms yet. Add your first room to get started."
                        : "No rooms match your search."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((room) => (
                    <tr key={room.id} className="hover:bg-gray-50/70">
                      <td className="px-6 py-4">
                        <p className="font-display text-brand-900 font-semibold">
                          {room.roomNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          Floor {room.floor}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        {room.roomCode ? (
                          <span className="font-mono text-sm text-gray-700">
                            {room.roomCode}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            roomTypeColor[room.type] ||
                            "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {room.type}
                        </span>
                      </td>

                      <td className="text-brand-900 px-6 py-4 font-medium">
                        ₹{Number(room.rate).toLocaleString()}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusPill(room.status)}`}
                        >
                          {statusLabel(room.status)}
                        </span>
                        {room.pendingDelete && (
                          <span className="mt-1.5 block">
                            <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                              Delete pending
                            </span>
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <ChannelStatusBadge
                          status={room.channelSyncStatus}
                          pendingDelete={room.pendingDelete}
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(room);
                              setFormOpen(true);
                            }}
                            className="text-primary-400 hover:text-primary-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(room)}
                            disabled={
                              removing === room.id || room.pendingDelete
                            }
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {room.pendingDelete
                              ? "Pending"
                              : removing === room.id
                                ? "..."
                                : "Delete"}
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
        <RoomFormModal
          room={editing}
          onClose={() => setFormOpen(false)}
          onSaved={(saved) => {
            setRooms((previous) => {
              const exists = previous.some((item) => item.id === saved.id);

              if (exists) {
                return previous.map((item) =>
                  item.id === saved.id ? saved : item,
                );
              }

              return [...previous, saved];
            });

            setToast(editing ? "Room updated." : "Room added.");
          }}
        />
      )}
    </div>
  );
}
