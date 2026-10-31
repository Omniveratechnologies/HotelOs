import { useState } from "react";
import { RotateCw, RefreshCw, LogOut, Check } from "lucide-react";
import { Modal, Input, Button } from "@hotelos/ui/components";
import {
  useUpdateKiosk,
  useSendKioskCommand,
  useKioskDashboards,
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
    kiosk?.targetDashboard || "DEMO_PORTAL",
  );
  const [customUrl, setCustomUrl] = useState(kiosk?.customUrl || "");
  const [commandFeedback, setCommandFeedback] = useState("");
  const [errors, setErrors] = useState({});

  if (!kiosk) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: "Terminal name is required" });
      return;
    }
    if (targetDashboard === "CUSTOM_URL" && !customUrl.trim()) {
      setErrors({ customUrl: "Custom URL is required for custom mode" });
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
          customUrl: targetDashboard === "CUSTOM_URL" ? customUrl.trim() : null,
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
            onChange={(e) => setHotelId(e.target.value)}
            className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:ring-1 focus:outline-none"
          >
            {hotels.map((h) => (
              <option key={h._id} value={h._id}>
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
              onChange={(e) => setTargetDashboard(e.target.value)}
              className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:ring-1 focus:outline-none"
            >
              {dashboards.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
              <option value="CUSTOM_URL">Custom Embedded Web URL</option>
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

        {/* Selected Dashboard Info */}
        {selectedPreset && (
          <div className="rounded-lg bg-gray-50 p-2.5 text-xs text-gray-600">
            <span className="font-semibold text-gray-700">Target URL:</span>{" "}
            <code className="text-brand-700 font-mono">
              {selectedPreset.url}
            </code>
            <p className="mt-1 text-gray-500">{selectedPreset.description}</p>
          </div>
        )}

        {targetDashboard === "CUSTOM_URL" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Custom Embedded Web URL *
            </label>
            <Input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              error={errors.customUrl}
            />
          </div>
        )}

        {/* Current Assigned URL View */}
        <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
          <span className="font-semibold text-gray-700">
            Active Loaded URL:
          </span>{" "}
          <code className="text-brand-600">
            {kiosk.assignedUrl || "Default Demo URL"}
          </code>
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
