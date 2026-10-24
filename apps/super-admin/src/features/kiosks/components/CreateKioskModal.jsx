import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal, Input, Button } from "@hotelos/ui/components";
import { useCreateKiosk, useKioskDashboards } from "../hooks/useKiosks.js";
import { useHotels } from "../../hotels/hooks/useHotels.js";

export default function CreateKioskModal({ open, onClose, onCreated }) {
  const { hotels } = useHotels();
  const { dashboards } = useKioskDashboards();
  const createKioskMutation = useCreateKiosk();

  const [hotelId, setHotelId] = useState("");
  const [name, setName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [location, setLocation] = useState("Main Lobby");
  const [targetDashboard, setTargetDashboard] = useState("DEMO_PORTAL");
  const [customUrl, setCustomUrl] = useState("");
  const [errors, setErrors] = useState({});

  function resetForm() {
    setHotelId("");
    setName("");
    setDeviceId("");
    setLocation("Main Lobby");
    setTargetDashboard("DEMO_PORTAL");
    setCustomUrl("");
    setErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function validate() {
    const errs = {};
    if (!hotelId) errs.hotelId = "Please select an assigned hotel";
    if (!name.trim()) errs.name = "Terminal name is required";
    if (!deviceId.trim()) errs.deviceId = "Device ID is required";
    if (targetDashboard === "CUSTOM_URL" && !customUrl.trim()) {
      errs.customUrl = "Custom URL is required when custom mode is chosen";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      const result = await createKioskMutation.mutateAsync({
        hotelId,
        name: name.trim(),
        deviceId: deviceId.trim().toUpperCase(),
        location: location.trim(),
        targetDashboard,
        customUrl: targetDashboard === "CUSTOM_URL" ? customUrl.trim() : null,
      });

      if (onCreated) {
        onCreated(result);
      }
      handleClose();
    } catch (err) {
      setErrors({ form: err?.message || "Failed to register kiosk terminal" });
    }
  }

  const selectedPreset = dashboards.find((d) => d.id === targetDashboard);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Register Kiosk Terminal"
      description="Provision a new Android touchscreen terminal and generate its one-time pairing key"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {errors.form}
          </div>
        )}

        {/* Assigned Hotel */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Associated Hotel *
          </label>
          <select
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
            className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:ring-1 focus:outline-none"
          >
            <option value="">Select a hotel...</option>
            {hotels.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name} {h.city ? `(${h.city})` : ""}
              </option>
            ))}
          </select>
          {errors.hotelId && (
            <p className="mt-1 text-xs text-rose-600">{errors.hotelId}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Terminal Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Terminal Name *
            </label>
            <Input
              placeholder="e.g. Lobby Entrance Kiosk #1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
          </div>

          {/* Device ID */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Hardware Device ID *
            </label>
            <Input
              placeholder="e.g. KIOSK-LOBBY-01"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              error={errors.deviceId}
            />
            <p className="mt-1 text-xs text-gray-500">
              Matches the Device ID shown on the kiosk setup screen.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Location */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Physical Location
            </label>
            <Input
              placeholder="e.g. Main Lobby East"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Target Dashboard */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Target Dashboard / Mode *
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
              placeholder="https://demo.hotelos.com/custom-terminal"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              error={errors.customUrl}
            />
          </div>
        )}

        <div className="rounded-lg bg-sky-50 p-3 text-xs text-sky-800">
          <p className="font-semibold">One-time physical setup:</p>
          <p>
            The server generates a 6-digit pairing code. Enter that code on the
            kiosk tablet once. Afterwards, all hotel reassignments and dashboard
            changes apply remotely over the network.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <Button variant="secondary" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            icon={Plus}
            loading={createKioskMutation.isPending}
          >
            Register & Generate Pair Code
          </Button>
        </div>
      </form>
    </Modal>
  );
}
