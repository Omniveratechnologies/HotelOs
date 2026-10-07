import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  BedDouble,
  User,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Layers,
  LogOut,
  LogIn,
  PlusCircle,
  Wrench,
  RotateCcw,
} from "lucide-react";
import {
  Modal,
  Button,
  Input,
  StatusChip,
  InlineBanner,
} from "@hotelos/ui/components";

const STATUS_VARIANTS = {
  available: "confirmed",
  occupied: "checked-in",
  reserved: "pending",
  cleaning: "neutral",
  maintenance: "cancelled",
  "out-of-order": "cancelled",
};

const STATUS_LABELS = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
  cleaning: "Needs Cleaning",
  maintenance: "Under Maintenance",
  "out-of-order": "Out of Order",
};

export default function RoomModal({
  room,
  onClose,
  updateRoomStatus,
  updateRoom,
}) {
  const navigate = useNavigate();
  const [view, setView] = useState("info"); // "info" | "checkout"
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [channelCode, setChannelCode] = useState(room?.roomCode || "");
  const [channelSaving, setChannelSaving] = useState(false);
  const [channelSuccess, setChannelSuccess] = useState(false);

  if (!room) return null;

  const unverified = room.channelVerified === false;

  const runUpdate = async (newStatus, guestData = {}) => {
    setError("");
    setSaving(true);
    try {
      if (updateRoomStatus) {
        await updateRoomStatus(room.id, newStatus, guestData);
      }
      onClose?.();
    } catch (err) {
      console.error("Room update failed:", err);
      setError(err.message || "Failed to update room status.");
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

  const handleMarkCleaning = () => {
    if (saving) return;
    runUpdate("cleaning", {});
  };

  const handleMarkMaintenance = () => {
    if (saving) return;
    runUpdate("maintenance", {});
  };

  const handleCancelReservation = () => {
    if (saving) return;
    runUpdate("available", { guest: null, checkIn: null, checkOut: null });
  };

  const handleChannelSave = async () => {
    if (!updateRoom) return;
    setChannelSaving(true);
    setError("");
    setChannelSuccess(false);
    try {
      await updateRoom(room.id, { roomCode: channelCode.trim() || undefined });
      setChannelSuccess(true);
      setTimeout(() => {
        onClose?.();
      }, 600);
    } catch (err) {
      console.error("Room code update failed:", err);
      setError(err.message || "Failed to update room code.");
    } finally {
      setChannelSaving(false);
    }
  };

  const nightsCount =
    room.checkIn && room.checkOut
      ? Math.max(
          1,
          Math.round(
            (new Date(room.checkOut) - new Date(room.checkIn)) / 86400000,
          ),
        )
      : 1;

  const totalEstimate =
    room.checkIn && room.checkOut && room.rate ? room.rate * nightsCount : null;

  const statusVariant = STATUS_VARIANTS[room.status] || "neutral";
  const statusLabel =
    STATUS_LABELS[room.status] || (room.status || "").toUpperCase();

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Room ${room.roomNumber}`}
      subtitle={`${room.type} Room • Floor ${room.floor || 1}`}
      maxWidth="lg"
    >
      <div className="space-y-5 p-1">
        {/* Error notification */}
        {error && (
          <InlineBanner variant="error" className="mb-2">
            {error}
          </InlineBanner>
        )}

        {channelSuccess && (
          <InlineBanner variant="success" className="mb-2">
            Channel code updated successfully!
          </InlineBanner>
        )}

        {/* Room Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-brand-50 text-brand-700 flex h-12 w-12 items-center justify-center rounded-xl shadow-2xs">
              <BedDouble className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-brand-900 font-display text-lg font-bold">
                  Room {room.roomNumber}
                </span>
                <span className="rounded-md bg-gray-200/70 px-2 py-0.5 text-xs font-semibold text-gray-700">
                  {room.type}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Layers className="h-3.5 w-3.5" />
                <span>Floor {room.floor || 1}</span>
                <span>•</span>
                <span className="text-brand-800 font-semibold">
                  ₹{Number(room.rate || 0).toLocaleString()} / night
                </span>
              </div>
            </div>
          </div>

          <StatusChip variant={statusVariant}>{statusLabel}</StatusChip>
        </div>

        {/* Channel Review Alert if needed */}
        {room.roomCode && room.channelSyncStatus === "under_review" && (
          <InlineBanner variant="warning">
            <div className="text-xs">
              <span className="font-semibold">Channel sync under review:</span>{" "}
              Room <strong>{room.roomNumber}</strong> is pending super admin
              verification in the property inventory. Check-in and booking are
              restricted until verified.
            </div>
          </InlineBanner>
        )}

        {/* VIEW: Info & Operations */}
        {view === "info" && (
          <div className="space-y-4">
            {/* Occupied / Reserved Guest Card */}
            {(room.guest || room.checkIn || room.checkOut) && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-blue-700 uppercase">
                    <User className="h-3.5 w-3.5" />
                    {room.status === "occupied"
                      ? "Current In-House Guest"
                      : "Reserved Guest"}
                  </span>
                  {totalEstimate !== null && (
                    <span className="text-xs font-bold text-blue-900">
                      Est. Folio: ₹{totalEstimate.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="text-brand-900 text-base font-bold">
                  {room.guest || "Guest details pending"}
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs text-gray-600 sm:grid-cols-3">
                  <div className="rounded-lg bg-white/80 p-2">
                    <span className="block text-[11px] text-gray-400">
                      Check-in
                    </span>
                    <span className="font-semibold text-gray-800">
                      {room.checkIn || "—"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-white/80 p-2">
                    <span className="block text-[11px] text-gray-400">
                      Check-out
                    </span>
                    <span className="font-semibold text-gray-800">
                      {room.checkOut || "—"}
                    </span>
                  </div>
                  <div className="col-span-2 rounded-lg bg-white/80 p-2 sm:col-span-1">
                    <span className="block text-[11px] text-gray-400">
                      Duration
                    </span>
                    <span className="font-semibold text-gray-800">
                      {nightsCount} {nightsCount === 1 ? "night" : "nights"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Status Toggles */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5">
              <div className="mb-2.5 text-xs font-bold tracking-wide text-gray-500 uppercase">
                Quick Room State
              </div>
              <div className="flex flex-wrap gap-2">
                {room.status !== "available" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={CheckCircle2}
                    onClick={handleMarkClean}
                    loading={saving}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    Set Available
                  </Button>
                )}
                {room.status !== "cleaning" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Sparkles}
                    onClick={handleMarkCleaning}
                    loading={saving}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Mark Needs Cleaning
                  </Button>
                )}
                {room.status !== "maintenance" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Wrench}
                    onClick={handleMarkMaintenance}
                    loading={saving}
                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    Set Maintenance
                  </Button>
                )}
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="space-y-2 pt-1">
              {/* If Available or Cleaning: New Reservation or Fast Booking */}
              {(room.status === "available" || room.status === "cleaning") && (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Button
                    variant="primary"
                    icon={PlusCircle}
                    onClick={() => {
                      onClose?.();
                      navigate(
                        `/reservations/new?roomId=${room.id}${room.roomCode ? `&roomTypeCode=${room.roomCode}` : ""}`,
                      );
                    }}
                    disabled={saving || unverified}
                    className="w-full justify-center"
                  >
                    New Reservation
                  </Button>

                  <Button
                    variant="secondary"
                    icon={RotateCcw}
                    onClick={() => {
                      onClose?.();
                      navigate(`/reservations/repeat/new?roomId=${room.id}`);
                    }}
                    disabled={saving || unverified}
                    className="w-full justify-center"
                  >
                    Repeat Guest Booking
                  </Button>
                </div>
              )}

              {/* If Reserved: Check In Guest or Cancel */}
              {room.status === "reserved" && (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    icon={LogIn}
                    onClick={() => {
                      onClose?.();
                      navigate(
                        `/front-desk/check-in?roomId=${room.id}&guest=${encodeURIComponent(room.guest || "")}`,
                      );
                    }}
                    disabled={saving || unverified}
                    className="w-full justify-center py-3"
                  >
                    Proceed to Front Desk Check-In
                  </Button>

                  <Button
                    variant="dangerGhost"
                    size="sm"
                    onClick={handleCancelReservation}
                    loading={saving}
                    className="w-full justify-center"
                  >
                    Cancel Reservation
                  </Button>
                </div>
              )}

              {/* If Occupied: Check Out or Add Services */}
              {room.status === "occupied" && (
                <div className="space-y-2">
                  <Button
                    variant="danger"
                    icon={LogOut}
                    onClick={() => setView("checkout")}
                    disabled={saving}
                    className="w-full justify-center py-2.5"
                  >
                    Check Out Guest
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        onClose?.();
                        navigate("/housekeeping");
                      }}
                      className="justify-center"
                    >
                      Housekeeping Request
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        onClose?.();
                        navigate("/food");
                      }}
                      className="justify-center"
                    >
                      Food Order
                    </Button>
                  </div>
                </div>
              )}

              {/* If Cleaning: Clean & Available */}
              {room.status === "cleaning" && (
                <Button
                  variant="primary"
                  icon={CheckCircle2}
                  onClick={handleMarkClean}
                  loading={saving}
                  className="w-full justify-center bg-emerald-600 hover:bg-emerald-700"
                >
                  Mark as Clean & Available
                </Button>
              )}
            </div>

            {/* Channel Mapping (Aiosell) */}
            <div className="border-t border-gray-100 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  Channel Manager Mapping
                </span>
                {room.roomCode && room.channelSyncStatus === "completed" && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    SYNCED
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={channelCode}
                    onChange={(e) => setChannelCode(e.target.value)}
                    placeholder="e.g. 101S, DELUXE-A"
                    disabled={channelSaving}
                  />
                </div>
                {updateRoom && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleChannelSave}
                    loading={channelSaving}
                    disabled={channelSaving}
                    className="mt-0.5 self-start"
                  >
                    Save Code
                  </Button>
                )}
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400">
                Aiosell channel room identifier. Updating code flags the room
                for Super Admin property verification.
              </p>
            </div>
          </div>
        )}

        {/* VIEW: Checkout Confirmation */}
        {view === "checkout" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-bold text-rose-800">
                <AlertTriangle className="h-4 w-4" />
                Confirm Guest Departure
              </div>
              <p className="text-xs text-rose-700">
                Checking out will release Room {room.roomNumber} and switch its
                status to <strong>Needs Cleaning</strong>.
              </p>
            </div>

            <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Guest Name</span>
                <span className="text-brand-900 font-semibold">
                  {room.guest || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Room</span>
                <span className="text-brand-900 font-semibold">
                  {room.roomNumber} ({room.type})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stay Duration</span>
                <span>
                  {room.checkIn || "—"} to {room.checkOut || "—"} ({nightsCount}{" "}
                  {nightsCount === 1 ? "night" : "nights"})
                </span>
              </div>
              {totalEstimate !== null && (
                <div className="flex justify-between border-t border-gray-200 pt-2 font-bold">
                  <span className="text-brand-900">Estimated Total</span>
                  <span className="text-emerald-700">
                    ₹{totalEstimate.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setView("info")}
                disabled={saving}
                className="flex-1 justify-center"
              >
                Back
              </Button>
              <Button
                variant="danger"
                icon={LogOut}
                onClick={handleCheckOut}
                loading={saving}
                className="flex-1 justify-center"
              >
                Confirm Check Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
