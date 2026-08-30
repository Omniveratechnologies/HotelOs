import React, { useState } from "react";
import AddGuestModal from "../pages/guests/_components/AddGuestModal.jsx";

export default function RoomModal({ room, onClose, updateRoomStatus }) {
  const [view, setView] = useState("info"); // info | checkout
  const [registerOpen, setRegisterOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const runUpdate = async (newStatus, guestData) => {
    setError("");
    setSaving(true);
    try {
      await updateRoomStatus(room.id, newStatus, guestData);
      onClose();
    } catch (err) {
      console.error("Room update failed:", err);
      setError(err.message || "Failed to update the room.");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckOut = () => {
    if (saving) return;
    runUpdate("cleaning", { guest: null, checkIn: null, checkOut: null });
  };

  const handleMarkClean = () => {
    if (saving) return;
    runUpdate("available", {});
  };

  const handleCancelReservation = () => {
    if (saving) return;
    runUpdate("available", { guest: null });
  };

  const handleMarkCleaning = () => {
    if (saving) return;
    runUpdate("cleaning", {});
  };

  // Real guest creation - opens the shared registration form
  const openRegister = () => setRegisterOpen(true);

  const totalEstimate =
    room.checkIn && room.checkOut
      ? room.rate *
        Math.max(
          1,
          Math.round(
            (new Date(room.checkOut) - new Date(room.checkIn)) / 86400000,
          ),
        )
      : null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-navy-900 flex items-center justify-between rounded-t-2xl p-5">
            <div>
              <div className="text-gold-400 text-xs font-semibold tracking-widest uppercase">
                Room {room.roomNumber}
              </div>
              <div className="mt-0.5 text-lg font-bold text-white">
                {room.type} Room
              </div>
              <div className="text-sm text-white/60">₹{room.rate}/night</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={onClose}
                className="text-white/40 transition-colors hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  room.status === "available"
                    ? "bg-green-500 text-white"
                    : room.status === "occupied"
                      ? "bg-blue-500 text-white"
                      : room.status === "reserved"
                        ? "bg-amber-500 text-white"
                        : "bg-gray-400 text-white"
                }`}
              >
                {room.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {error && (
              <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {view === "info" && (
              <div>
                {room.guest && (
                  <div className="mb-4 rounded-xl bg-blue-50 p-4">
                    <div className="mb-1 text-xs font-semibold tracking-wide text-blue-600 uppercase">
                      Current Guest
                    </div>
                    <div className="text-navy-900 text-lg font-bold">
                      {room.guest}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Check-in: {room.checkIn || "—"} · Check-out:{" "}
                      {room.checkOut || "—"}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {(room.status === "available" ||
                    room.status === "cleaning") && (
                    <>
                      <button
                        onClick={openRegister}
                        disabled={saving}
                        className="bg-navy-900 hover:bg-navy-800 col-span-2 rounded-xl py-3 font-semibold text-white transition-colors disabled:opacity-60"
                      >
                        ✓ Check In Guest
                      </button>
                      <button
                        onClick={openRegister}
                        disabled={saving}
                        className="rounded-xl border-2 border-amber-400 py-3 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-50 disabled:opacity-60"
                      >
                        📅 Reserve Room
                      </button>
                      {room.status === "available" && (
                        <button
                          onClick={handleMarkCleaning}
                          disabled={saving}
                          className="rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
                        >
                          🧹 Mark Cleaning
                        </button>
                      )}
                    </>
                  )}
                  {room.status === "occupied" && (
                    <>
                      <button
                        onClick={() => setView("checkout")}
                        className="col-span-2 rounded-xl bg-red-500 py-3 font-semibold text-white transition-colors hover:bg-red-600"
                      >
                        ← Check Out Guest
                      </button>
                      <button className="rounded-xl border-2 border-amber-400 py-3 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-50">
                        🔔 Add Request
                      </button>
                      <button className="rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50">
                        🍽 Food Order
                      </button>
                    </>
                  )}
                  {room.status === "reserved" && (
                    <>
                      <button
                        onClick={openRegister}
                        disabled={saving}
                        className="bg-navy-900 hover:bg-navy-800 col-span-2 rounded-xl py-3 font-semibold text-white transition-colors disabled:opacity-60"
                      >
                        ✓ Check In Guest
                      </button>
                      <button
                        onClick={handleCancelReservation}
                        disabled={saving}
                        className="col-span-2 rounded-xl border-2 border-red-200 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-60"
                      >
                        Cancel Reservation
                      </button>
                    </>
                  )}
                  {room.status === "cleaning" && (
                    <button
                      onClick={handleMarkClean}
                      disabled={saving}
                      className="col-span-2 rounded-xl bg-green-600 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                    >
                      ✓ Mark as Clean & Available
                    </button>
                  )}
                </div>
              </div>
            )}

            {view === "checkout" && (
              <div>
                <h3 className="text-navy-900 mb-3 font-bold">
                  Confirm Check Out
                </h3>
                <div className="mb-4 space-y-2 rounded-xl bg-gray-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Guest</span>
                    <span className="font-semibold">{room.guest}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Room</span>
                    <span className="font-semibold">
                      {room.roomNumber} · {room.type}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Check-in</span>
                    <span>{room.checkIn || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Check-out</span>
                    <span>{room.checkOut || "—"}</span>
                  </div>
                  {totalEstimate !== null && (
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Total (est.)</span>
                      <span className="text-navy-900">
                        ₹{totalEstimate.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setView("info")}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCheckOut}
                    disabled={saving}
                    className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
                  >
                    {saving ? "Checking Out..." : "Confirm Check Out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real guest registration prefilled with this room */}
      {registerOpen && (
        <AddGuestModal
          initial={{
            roomId: room.id,
            roomNumber: room.roomNumber,
          }}
          onClose={() => setRegisterOpen(false)}
          onRegistered={() => {
            setRegisterOpen(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
