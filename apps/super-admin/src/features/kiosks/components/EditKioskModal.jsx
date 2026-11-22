import { useState } from "react";
import { RotateCw, RefreshCw, LogOut, Check } from "lucide-react";
import { Modal, Input, Button } from "@hotelos/ui/components";
import { KIOSK_SUPPORTED_FEATURES, formatTime } from "@hotelos/utils";
import {
  useUpdateKiosk,
  useSendKioskCommand,
  useKioskDashboards,
  useHotelTables,
  useHotelRooms,
} from "../hooks/useKiosks.js";
import { useHotels } from "../../hotels/hooks/useHotels.js";

export default function EditKioskModal({ kiosk, open, onClose, onUpdated }) {
  const { hotels } = useHotels();
  const { dashboards } = useKioskDashboards();
  const updateKioskMutation = useUpdateKiosk();
  const sendCommandMutation = useSendKioskCommand();

  const [hotelId, setHotelId] = useState(
    kiosk?.hotelId?._id || kiosk?.hotelId || "",
  );
  const [name, setName] = useState(kiosk?.name || "");
  const [location, setLocation] = useState(kiosk?.location || "Main Lobby");
  const [status, setStatus] = useState(kiosk?.status || "ONLINE");
  const [targetDashboard, setTargetDashboard] = useState(
    kiosk?.targetDashboard || "GUEST_DASHBOARD",
  );
  const [tableId, setTableId] = useState(
    kiosk?.tableId?._id || kiosk?.tableId || "",
  );
  const [roomId, setRoomId] = useState(
    kiosk?.roomId?._id || kiosk?.roomId || "",
  );
  const [supportedFeatures, setSupportedFeatures] = useState(
    kiosk?.supportedFeatures || ["CHECK_IN", "KEY_DISPENSE", "DOCUMENT_SCAN"],
  );
  const [commandFeedback, setCommandFeedback] = useState("");
  const [errors, setErrors] = useState({});

  const { tables, isLoading: tablesLoading } = useHotelTables(hotelId);
  const { rooms, isLoading: roomsLoading } = useHotelRooms(hotelId);

  const [prevKioskId, setPrevKioskId] = useState(kiosk?._id);
  if (kiosk?._id && kiosk._id !== prevKioskId) {
    setPrevKioskId(kiosk._id);
    setHotelId(kiosk?.hotelId?._id || kiosk?.hotelId || "");
    setName(kiosk?.name || "");
    setLocation(kiosk?.location || "Main Lobby");
    setStatus(kiosk?.status || "ONLINE");
    setTargetDashboard(kiosk?.targetDashboard || "GUEST_DASHBOARD");
    setTableId(
      kiosk?.tableId?._id || kiosk?.tableId?.id || kiosk?.tableId || "",
    );
    setRoomId(kiosk?.roomId?._id || kiosk?.roomId?.id || kiosk?.roomId || "");
    setSupportedFeatures(
      Array.isArray(kiosk?.supportedFeatures) &&
        kiosk.supportedFeatures.length > 0
        ? kiosk.supportedFeatures
        : ["CHECK_IN", "KEY_DISPENSE", "DOCUMENT_SCAN"],
    );
    setCommandFeedback("");
    setErrors({});
  }

  if (!kiosk) return null;

  function toggleFeature(featId) {
    setSupportedFeatures((prev) =>
      prev.includes(featId)
        ? prev.filter((f) => f !== featId)
        : [...prev, featId],
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: "Terminal name is required" });
      return;
    }

    try {
      const updated = await updateKioskMutation.mutateAsync({
        id: kiosk._id,
        data: {
          hotelId,
          name: name.trim(),
          location: location.trim(),
          status,
          targetDashboard,
          tableId: targetDashboard === "DIGITAL_MENU" ? tableId || null : null,
          roomId: targetDashboard === "GUEST_DASHBOARD" ? roomId || null : null,
          supportedFeatures,
        },
      });

      if (onUpdated) onUpdated(updated);
      onClose();
    } catch (err) {
      setErrors({ form: err?.message || "Failed to update kiosk terminal" });
    }
  }

  async function handleSendCommand(command, label) {
    try {
      setCommandFeedback("");
      await sendCommandMutation.mutateAsync({
        id: kiosk._id,
        command,
      });
      setCommandFeedback(`Command "${label}" dispatched successfully.`);
      setTimeout(() => setCommandFeedback(""), 4000);
    } catch (err) {
      setErrors({ command: err?.message || "Failed to dispatch command" });
    }
  }

  const selectedPreset = dashboards.find((d) => d.id === targetDashboard);

  // Compute live preview of assigned URL
  let resolvedUrl = selectedPreset?.url || "";
  if (targetDashboard === "DIGITAL_MENU" && hotelId && tableId) {
    resolvedUrl = `${resolvedUrl}/${hotelId}/table/${tableId}`;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Configure Terminal: ${kiosk.name}`}
      description={`Device ID: ${kiosk.deviceId} • Firmware: ${kiosk.firmwareVersion || "v1.4.0"}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {errors.form}
          </div>
        )}

        {commandFeedback && (
          <div className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
            {commandFeedback}
          </div>
        )}

        {/* Reassign Hotel */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Assigned Hotel *
          </label>
          <select
            value={hotelId}
            onChange={(e) => {
              setHotelId(e.target.value);
              setTableId(""); // reset table selection when hotel changes
              setRoomId(""); // reset room selection when hotel changes
            }}
            className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:ring-1 focus:outline-none"
          >
            {hotelId &&
              !hotels.some(
                (h) => String(h._id || h.id) === String(hotelId),
              ) && (
                <option value={hotelId}>
                  {kiosk?.hotelId?.name || "Assigned Hotel"}
                </option>
              )}
            {hotels.map((h) => (
              <option key={h._id || h.id} value={h._id || h.id}>
                {h.name} {h.city ? `(${h.city})` : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Reassigning hotel updates the terminal remotely over WebSocket.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Terminal Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Terminal Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
          </div>

          {/* Location */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Location
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Target Dashboard Mode */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Target Dashboard Mode *
            </label>
            <select
              value={targetDashboard}
              onChange={(e) => {
                setTargetDashboard(e.target.value);
                if (e.target.value !== "DIGITAL_MENU") {
                  setTableId("");
                }
                if (e.target.value !== "GUEST_DASHBOARD") {
                  setRoomId("");
                }
              }}
              className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:ring-1 focus:outline-none"
            >
              {dashboards.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Operational Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:ring-1 focus:outline-none"
            >
              <option value="ONLINE">ONLINE (Active)</option>
              <option value="MAINTENANCE">MAINTENANCE (Diagnostics)</option>
              <option value="DISABLED">DISABLED (Revoke Access)</option>
            </select>
          </div>
        </div>

        {/* Room Selection when Guest Dashboard is selected */}
        {targetDashboard === "GUEST_DASHBOARD" && (
          <div className="space-y-2 rounded-xl border border-sky-200 bg-sky-50/60 p-3.5">
            <label className="block text-xs font-bold tracking-wide text-sky-900 uppercase">
              Assigned Hotel Room (Guest Dashboard)
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              disabled={!hotelId || roomsLoading}
              className="w-full rounded-lg border border-sky-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none"
            >
              <option value="">
                {!hotelId
                  ? "Select a hotel first..."
                  : roomsLoading
                    ? "Loading rooms..."
                    : "No specific room (General Lobby/Unassigned Kiosk)"}
              </option>
              {roomId &&
                !rooms.some(
                  (r) => String(r.id || r._id) === String(roomId),
                ) && (
                  <option value={roomId}>
                    {kiosk?.roomId?.roomNumber
                      ? `Room ${kiosk.roomId.roomNumber} (${kiosk.roomId.type || "Room"}) (Assigned)`
                      : "Assigned Room"}
                  </option>
                )}
              {rooms.map((r) => (
                <option key={r.id || r._id} value={r.id || r._id}>
                  Room {r.roomNumber} ({r.type || "Room"}, Floor {r.floor || 1})
                </option>
              ))}
            </select>
            <p className="text-xs text-sky-800">
              When assigned, this in-room terminal automatically logs in as the
              guest when they check into this room, and logs out upon check-out.
            </p>
          </div>
        )}

        {/* Dining Table Selection when Digital Menu is selected */}
        {targetDashboard === "DIGITAL_MENU" && (
          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
            <label className="block text-xs font-bold tracking-wide text-amber-900 uppercase">
              Assigned Dining Table (Digital Menu)
            </label>
            <select
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              disabled={!hotelId || tablesLoading}
              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-amber-500 focus:outline-none"
            >
              <option value="">
                {!hotelId
                  ? "Select a hotel first..."
                  : tablesLoading
                    ? "Loading tables..."
                    : "No specific table (Guest QR scan required)"}
              </option>
              {tableId &&
                !tables.some(
                  (t) => String(t.id || t._id) === String(tableId),
                ) && (
                  <option value={tableId}>
                    {kiosk?.tableId?.tableNumber
                      ? `Table ${kiosk.tableId.tableNumber}${kiosk.tableId.section ? ` (${kiosk.tableId.section})` : ""} (Assigned)`
                      : "Assigned Table"}
                  </option>
                )}
              {tables.map((t) => (
                <option key={t.id || t._id} value={t.id || t._id}>
                  Table {t.tableNumber} {t.section ? `(${t.section})` : ""} —{" "}
                  {t.seats || t.capacity || 4} seats
                </option>
              ))}
            </select>
            <p className="text-xs text-amber-800">
              When assigned, the kiosk loads this table's order menu directly.
            </p>
          </div>
        )}

        {/* Supported Hardware Features */}
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-gray-500 uppercase">
            Supported Hardware & Peripheral Features
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {KIOSK_SUPPORTED_FEATURES.map((feat) => {
              const active = supportedFeatures.includes(feat.id);
              return (
                <button
                  type="button"
                  key={feat.id}
                  onClick={() => toggleFeature(feat.id)}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition ${
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-800"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      active ? "bg-brand-600" : "bg-gray-300"
                    }`}
                  />
                  <span>{feat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Resolved URL Preview */}
        {selectedPreset && (
          <div className="rounded-lg bg-gray-50 p-2.5 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">
                Resolved Live URL:
              </span>
              <span className="text-[11px] text-gray-500">
                {selectedPreset.name}
              </span>
            </div>
            <code className="text-brand-700 mt-1 block font-mono break-all">
              {resolvedUrl}
            </code>
            <p className="mt-1 text-gray-500">{selectedPreset.description}</p>
          </div>
        )}

        {/* Hardware Diagnostics Snapshot */}
        <div className="space-y-1.5 rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-xs text-gray-600">
          <span className="block text-[11px] font-bold tracking-wider text-gray-500 uppercase">
            Terminal Diagnostics
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-700 sm:grid-cols-3">
            <div>
              <span className="text-gray-500">IP Address:</span>{" "}
              <span className="font-mono">
                {kiosk.ipAddress || "Dynamic / Unknown"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">App Version:</span>{" "}
              <span>{kiosk.appVersion || "1.0.0"}</span>
            </div>
            <div>
              <span className="text-gray-500">Firmware:</span>{" "}
              <span>{kiosk.firmwareVersion || "v1.4.0"}</span>
            </div>
            <div>
              <span className="text-gray-500">Battery:</span>{" "}
              <span>
                {typeof kiosk.batteryLevel === "number"
                  ? `${Math.round(kiosk.batteryLevel * 100)}%`
                  : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Pairing State:</span>{" "}
              <span className="font-semibold">
                {kiosk.isPaired ? "Paired" : "Awaiting Pairing"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Heartbeat:</span>{" "}
              <span>{formatTime(kiosk.lastHeartbeat) || "Online"}</span>
            </div>
          </div>
        </div>

        {/* Remote Hardware Controls */}
        <div className="border-t border-gray-100 pt-3">
          <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">
            Remote Hardware Actions (Socket Push)
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSendCommand("device:reload", "Reload Page")}
              disabled={sendCommandMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RotateCw className="h-3.5 w-3.5 text-gray-500" /> Reload WebView
            </button>
            <button
              type="button"
              onClick={() =>
                handleSendCommand("device:restart", "Restart Kiosk")
              }
              disabled={sendCommandMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5 text-amber-600" /> Restart Kiosk
              Mode
            </button>
            <button
              type="button"
              onClick={() =>
                handleSendCommand("device:exit-kiosk", "Exit Kiosk")
              }
              disabled={sendCommandMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-600" /> Exit Kiosk
              (Service)
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            icon={Check}
            loading={updateKioskMutation.isPending}
          >
            Save & Sync Terminal
          </Button>
        </div>
      </form>
    </Modal>
  );
}
