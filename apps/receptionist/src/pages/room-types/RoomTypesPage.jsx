import { useEffect, useState } from "react";
import { Header } from "@hotelos/ui/components/Header";
import RoomTypeModal from "./RoomTypeModal.jsx";
import {
  getRoomTypes,
  deleteRoomType,
} from "../../services/roomType.service.js";

const statusPill = (status) =>
  status === "completed"
    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border border-amber-200 bg-amber-50 text-amber-700";

const statusLabel = (status) =>
  status === "completed" ? "Synced" : "Under review";

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getRoomTypes();

        if (!cancelled) setRoomTypes(data);
      } catch (err) {
        console.error("Failed to load room types:", err);

        if (!cancelled) setError(err.message || "Failed to load room types");
      } finally {
        if (!cancelled) setLoading(false);
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

  const handleDelete = async (roomType) => {
    if (!window.confirm(`Delete room type ${roomType.name}?`)) return;

    setRemoving(roomType.id);

    try {
      await deleteRoomType(roomType.id);
      setRoomTypes((prev) => prev.filter((item) => item.id !== roomType.id));
      setToast(`Room type ${roomType.name} deleted.`);
    } catch (err) {
      console.error("Delete room type error:", err);
      setToast(err.message || "Failed to delete room type.");
    } finally {
      setRemoving("");
    }
  };

  return (
    <>
      <Header
        pageTitle="Room Types"
        pageDescription={`${loading ? "Loading..." : `${roomTypes.length} room types`}`}
      >
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="bg-brand-900 hover:bg-brand-800 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          + Add Room Type
        </button>
      </Header>
      <div className="p-6">
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

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mb-6">
          <input
            className="text-brand-900 focus:ring-primary-400 w-full max-w-xs rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-hidden focus:ring-2"
            placeholder="Search room types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left text-sm">
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
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill(roomType.channelSyncStatus)}`}
                        >
                          {statusLabel(roomType.channelSyncStatus)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(roomType);
                              setShowModal(true);
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

        {showModal && (
          <RoomTypeModal
            roomType={editing}
            onClose={() => setShowModal(false)}
            onSaved={(saved) => {
              setRoomTypes((prev) => {
                const exists = prev.some((item) => item.id === saved.id);

                if (exists) {
                  return prev.map((item) =>
                    item.id === saved.id ? saved : item,
                  );
                }

                return [...prev, saved];
              });

              setToast(editing ? "Room type updated." : "Room type added.");
            }}
          />
        )}
      </div>
    </>
  );
}
