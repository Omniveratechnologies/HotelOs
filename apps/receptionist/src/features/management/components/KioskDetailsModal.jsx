import React from "react";
import {
  MapPin,
  Battery,
  Wrench,
  CheckCircle2,
  UtensilsCrossed,
  Layers,
  Clock,
  Sparkles,
} from "lucide-react";
import { Modal, Button } from "@hotelos/ui/components";
import {
  formatTime,
  KIOSK_DASHBOARDS_METADATA,
  KIOSK_FEATURE_LABELS,
} from "@hotelos/utils";

export default function KioskDetailsModal({
  kiosk,
  open,
  onClose,
  onToggleMaintenance,
  isUpdatingMaintenance,
}) {
  if (!open || !kiosk) return null;

  const dashboardInfo = KIOSK_DASHBOARDS_METADATA[kiosk.targetDashboard] || {
    name: kiosk.targetDashboard || "Guest Dashboard",
    color: "bg-gray-50 text-gray-800 border-gray-200",
    description: "Touchscreen kiosk experience",
  };

  const isOnline = kiosk.status === "ONLINE";
  const isMaintenance = kiosk.status === "MAINTENANCE";
  const isDisabled = kiosk.status === "DISABLED";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={kiosk.name}
      subtitle={`Location: ${kiosk.location || "Main Lobby"}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Operational Status:</span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                isDisabled
                  ? "border border-slate-200 bg-slate-100 text-slate-700"
                  : isMaintenance
                    ? "border border-amber-200 bg-amber-50 text-amber-800"
                    : isOnline
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isDisabled
                    ? "bg-slate-400"
                    : isMaintenance
                      ? "bg-amber-500"
                      : isOnline
                        ? "animate-pulse bg-emerald-500"
                        : "bg-rose-500"
                }`}
              />
              {isOnline
                ? "ONLINE (Active)"
                : isMaintenance
                  ? "MAINTENANCE"
                  : isDisabled
                    ? "DISABLED"
                    : "OFFLINE (Disconnected)"}
            </span>
          </div>

          <div className="flex items-center gap-1 text-gray-500">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            <span>{kiosk.location || "Main Lobby"}</span>
          </div>
        </div>

        {/* 1. Dashboard Assignment Panel */}
        <div className="space-y-3 rounded-xl border border-sky-100 bg-sky-50/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-700" />
              <span className="text-xs font-bold tracking-wider text-sky-900 uppercase">
                Assigned Guest Experience
              </span>
            </div>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${dashboardInfo.color}`}
            >
              {dashboardInfo.name}
            </span>
          </div>

          <p className="text-xs text-gray-600">{dashboardInfo.description}</p>

          {/* If Digital Menu has an assigned table */}
          {kiosk.targetDashboard === "DIGITAL_MENU" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-bold">
                <UtensilsCrossed className="h-4 w-4 text-amber-600" />
                <span>Assigned Restaurant Dining Table:</span>
              </div>
              {kiosk.tableId ? (
                <div className="mt-1.5 flex items-center gap-4 text-amber-800">
                  <span>
                    Table: <strong>#{kiosk.tableId.tableNumber}</strong>
                  </span>
                  {kiosk.tableId.section && (
                    <span>
                      Section: <strong>{kiosk.tableId.section}</strong>
                    </span>
                  )}
                  {kiosk.tableId.seats && (
                    <span>
                      Capacity: <strong>{kiosk.tableId.seats} seats</strong>
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-xs text-amber-700">
                  No specific table assigned. Terminal displays QR scan landing
                  page.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 2. Operational Health: Last Activity & Battery */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-gray-500">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-medium">Last Activity</span>
            </div>
            <span className="font-semibold text-gray-800">
              {formatTime(kiosk.lastHeartbeat) || "Active now"}
            </span>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-gray-500">
              <Battery className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-medium">Power & Battery</span>
            </div>
            <span className="font-semibold text-gray-800">
              {typeof kiosk.batteryLevel === "number"
                ? `${Math.round(kiosk.batteryLevel * 100)}%`
                : "AC Powered"}
            </span>
          </div>
        </div>

        {/* 3. Supported Guest Services / Hardware Features */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Sparkles className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-bold tracking-wider text-gray-600 uppercase">
              Supported Guest Services
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              kiosk.supportedFeatures || [
                "CHECK_IN",
                "KEY_DISPENSE",
                "DOCUMENT_SCAN",
              ]
            ).map((feat) => (
              <span
                key={feat}
                className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700"
              >
                {KIOSK_FEATURE_LABELS[feat] || feat}
              </span>
            ))}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            {isMaintenance ? (
              <button
                type="button"
                disabled={isUpdatingMaintenance}
                onClick={() =>
                  onToggleMaintenance && onToggleMaintenance(kiosk, "ONLINE")
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-xs hover:bg-emerald-100 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Turn Off Maintenance Mode
              </button>
            ) : (
              <button
                type="button"
                disabled={isUpdatingMaintenance}
                onClick={() =>
                  onToggleMaintenance &&
                  onToggleMaintenance(kiosk, "MAINTENANCE")
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-xs hover:bg-amber-100 disabled:opacity-50"
              >
                <Wrench className="h-3.5 w-3.5 text-amber-600" />
                Turn On Maintenance Mode
              </button>
            )}
          </div>

          <Button variant="secondary" onClick={onClose} type="button">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
