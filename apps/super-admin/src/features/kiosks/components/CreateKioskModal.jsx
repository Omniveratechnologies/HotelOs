import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal, Input, Button } from "@hotelos/ui/components";
import { KIOSK_SUPPORTED_FEATURES } from "@hotelos/utils";
import {
  useCreateKiosk,
  useKioskDashboards,
  useHotelTables,
} from "../hooks/useKiosks.js";
import { useHotels } from "../../hotels/hooks/useHotels.js";

export default function CreateKioskModal({ open, onClose, onCreated }) {
  const { hotels } = useHotels();
  const { dashboards } = useKioskDashboards();
  const createKioskMutation = useCreateKiosk();

  const [hotelId, setHotelId] = useState("");
  const [name, setName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [location, setLocation] = useState("Main Lobby");
  const [targetDashboard, setTargetDashboard] = useState("GUEST_DASHBOARD");
  const [tableId, setTableId] = useState("");
  const [supportedFeatures, setSupportedFeatures] = useState([
    "CHECK_IN",
    "KEY_DISPENSE",
    "DOCUMENT_SCAN",
  ]);
  const [errors, setErrors] = useState({});

  const { tables, isLoading: tablesLoading } = useHotelTables(hotelId);

  function resetForm() {
    setHotelId("");
    setName("");
    setDeviceId("");
    setLocation("Main Lobby");
    setTargetDashboard("GUEST_DASHBOARD");
    setTableId("");
    setSupportedFeatures(["CHECK_IN", "KEY_DISPENSE", "DOCUMENT_SCAN"]);
    setErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function toggleFeature(featId) {
    setSupportedFeatures((prev) =>
      prev.includes(featId)
        ? prev.filter((f) => f !== featId)
        : [...prev, featId],
    );
  }

  function validate() {
    const errs = {};
    if (!hotelId) errs.hotelId = "Please select an assigned hotel";
    if (!name.trim()) errs.name = "Terminal name is required";
    if (!deviceId.trim()) errs.deviceId = "Device ID is required";
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
        tableId: targetDashboard === "DIGITAL_MENU" ? tableId || null : null,
        supportedFeatures,
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

  // Compute live preview of assigned URL
  let resolvedUrl = selectedPreset?.url || "";
  if (targetDashboard === "DIGITAL_MENU" && hotelId && tableId) {
    resolvedUrl = `${resolvedUrl}/${hotelId}/table/${tableId}`;
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Register Kiosk Terminal"
      description="Provision a new Android touchscreen terminal, assign its dashboard, and generate its one-time pairing key"
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
            onChange={(e) => {
              setHotelId(e.target.value);
              setTableId(""); // reset table selection when hotel changes
            }}
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
              onChange={(e) => {
                setTargetDashboard(e.target.value);
                if (e.target.value !== "DIGITAL_MENU") {
                  setTableId("");
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
        </div>

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

        <div className="rounded-lg bg-sky-50 p-3 text-xs text-sky-800">
          <p className="font-semibold">One-time physical setup:</p>
          <p>
            The server generates a 6-digit pairing code. Enter that code on the
            kiosk tablet once. Afterwards, all hotel reassignments, table
            bindings, and dashboard changes apply remotely over the network.
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
