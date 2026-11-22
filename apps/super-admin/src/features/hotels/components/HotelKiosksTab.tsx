import React, { useState, useMemo } from "react";
import {
  Monitor,
  Plus,
  Search,
  Wifi,
  WifiOff,
  Wrench,
  ShieldAlert,
  RotateCw,
  LogOut,
  Pencil,
  Trash2,
  Battery,
  BatteryCharging,
  RefreshCw,
} from "lucide-react";
import {
  Button,
  KpiTile,
  KpiTileRow,
  ConfirmDialog,
} from "@hotelos/ui/components";
import { formatTime, KIOSK_DASHBOARDS_METADATA } from "@hotelos/utils";
import {
  useKiosks,
  useRegeneratePairCode,
  useSendKioskCommand,
  useUpdateKiosk,
  useDeleteKiosk,
} from "../hooks/useKiosks.ts";
import { CreateKioskModal } from "./CreateKioskModal.tsx";
import { EditKioskModal } from "./EditKioskModal.tsx";
import type { KioskDevice } from "../types.ts";

export interface HotelKiosksTabProps {
  hotelId: string;
  hotelName: string;
}

export const HotelKiosksTab: React.FC<HotelKiosksTabProps> = ({
  hotelId,
  hotelName,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editKiosk, setEditKiosk] = useState<KioskDevice | null>(null);
  const [kioskToDelete, setKioskToDelete] = useState<KioskDevice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [banner, setBanner] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const { devices, stats, isLoading, refetch } = useKiosks({ hotelId }) as {
    devices: KioskDevice[];
    stats: {
      total: number;
      online: number;
      offline: number;
      maintenance: number;
      disabled: number;
    };
    isLoading: boolean;
    refetch: () => void;
  };

  const regeneratePairCodeMutation = useRegeneratePairCode() as unknown as {
    mutateAsync: (id: string) => Promise<{ pairCode?: string }>;
  };
  const sendCommandMutation = useSendKioskCommand() as unknown as {
    mutateAsync: (vars: {
      id: string;
      command: string;
      payload?: Record<string, unknown>;
    }) => Promise<unknown>;
  };
  const updateKioskMutation = useUpdateKiosk() as unknown as {
    mutateAsync: (vars: {
      id: string;
      data: Record<string, unknown>;
    }) => Promise<unknown>;
  };
  const deleteKioskMutation = useDeleteKiosk() as unknown as {
    mutateAsync: (id: string) => Promise<unknown>;
  };

  function showBanner(message: string, type: "success" | "error" = "success") {
    setBanner({ message, type });
    setTimeout(() => setBanner(null), 4500);
  }

  // Filter devices locally by search query
  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) return devices;
    const q = searchQuery.toLowerCase().trim();
    return devices.filter((d) => {
      const name = (d.name || "").toLowerCase();
      const deviceId = (d.deviceId || "").toLowerCase();
      const loc = (d.location || "").toLowerCase();
      return name.includes(q) || deviceId.includes(q) || loc.includes(q);
    });
  }, [devices, searchQuery]);

  // Action: Regenerate Pairing Code
  async function handleRegenerateCode(kiosk: KioskDevice) {
    const id = kiosk._id || kiosk.id;
    if (!id) return;
    try {
      const res = (await regeneratePairCodeMutation.mutateAsync(id)) as {
        pairCode?: string;
      };
      showBanner(`New pairing code generated: ${res.pairCode || "Success"}`);
      refetch();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate pairing code";
      showBanner(msg, "error");
    }
  }

  // Action: Remote Reload
  async function handleRemoteReload(kiosk: KioskDevice) {
    const id = kiosk._id || kiosk.id;
    if (!id) return;
    try {
      await sendCommandMutation.mutateAsync({
        id,
        command: "device:reload",
      });
      showBanner(
        `Reload command dispatched to terminal "${kiosk.name || kiosk.deviceId}".`,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to dispatch reload command";
      showBanner(msg, "error");
    }
  }

  // Action: Remote Exit Kiosk
  async function handleRemoteExitKiosk(kiosk: KioskDevice) {
    const id = kiosk._id || kiosk.id;
    if (!id) return;
    const confirmed = window.confirm(
      `Are you sure you want to remotely exit kiosk mode on "${kiosk.name || kiosk.deviceId}"? The physical terminal will unlock and return to the home screen.`,
    );
    if (!confirmed) return;

    try {
      await sendCommandMutation.mutateAsync({
        id,
        command: "device:exit-kiosk",
        payload: { reason: "Remotely requested by Super Admin" },
      });
      showBanner(
        `Exit Kiosk command dispatched to terminal "${kiosk.name || kiosk.deviceId}".`,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to dispatch exit kiosk command";
      showBanner(msg, "error");
    }
  }

  // Action: Toggle Maintenance Mode
  async function handleToggleMaintenance(kiosk: KioskDevice) {
    const id = kiosk._id || kiosk.id;
    if (!id) return;
    const nextStatus =
      kiosk.status === "MAINTENANCE" ? "ONLINE" : "MAINTENANCE";
    try {
      await updateKioskMutation.mutateAsync({
        id,
        data: { status: nextStatus },
      });
      showBanner(
        `Terminal status set to ${nextStatus === "MAINTENANCE" ? "Maintenance" : "Online"}.`,
      );
      refetch();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update terminal status";
      showBanner(msg, "error");
    }
  }

  // Action: Confirm Delete Kiosk
  async function handleDeleteConfirm() {
    if (!kioskToDelete) return;
    const id = kioskToDelete._id || kioskToDelete.id;
    if (!id) return;

    setDeleting(true);
    try {
      await deleteKioskMutation.mutateAsync(id);
      showBanner(
        `Terminal "${kioskToDelete.name || kioskToDelete.deviceId}" deleted successfully.`,
      );
      setKioskToDelete(null);
      refetch();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete terminal";
      showBanner(msg, "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast / Banner Message */}
      {banner && (
        <div
          className={`rounded-xl p-4 text-sm font-semibold shadow-xs ${
            banner.type === "error"
              ? "border border-rose-200 bg-rose-50 text-rose-800"
              : "border border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {banner.message}
        </div>
      )}

      {/* KPI Tiles Row */}
      <KpiTileRow>
        <KpiTile
          label="Total Terminals"
          value={stats.total}
          icon={Monitor}
          iconClassName="bg-brand-50 text-brand-700"
        />
        <KpiTile
          label="Online & Active"
          value={stats.online}
          icon={Wifi}
          iconClassName="bg-emerald-50 text-emerald-700"
        />
        <KpiTile
          label="Offline"
          value={stats.offline}
          icon={WifiOff}
          iconClassName={
            stats.offline > 0
              ? "bg-rose-50 text-rose-700"
              : "bg-gray-100 text-gray-700"
          }
        />
        <KpiTile
          label="Maintenance"
          value={stats.maintenance}
          icon={Wrench}
          iconClassName="bg-amber-50 text-amber-700"
        />
        <KpiTile
          label="Disabled"
          value={stats.disabled}
          icon={ShieldAlert}
          iconClassName="bg-red-50 text-red-700"
        />
      </KpiTileRow>

      {/* Main Container */}
      <div className="border-surface-200 overflow-hidden rounded-2xl border bg-white shadow-xs">
        {/* Header Bar */}
        <div className="flex flex-col gap-4 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-brand-900 text-lg font-semibold">
              Hardware Terminals & Kiosks
            </h3>
            <p className="text-brand-500 mt-0.5 text-xs">
              Physical touchscreen terminals, pairing codes, and remote controls
              for {hotelName}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button icon={Plus} onClick={() => setCreateModalOpen(true)}>
              Register Terminal
            </Button>
          </div>
        </div>

        {/* Toolbar: Search & Count */}
        <div className="bg-surface-50/50 flex flex-col gap-3 border-b px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Device ID, name, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-lg border border-gray-300 bg-white py-1.5 pr-3 pl-9 text-xs text-gray-800 shadow-xs focus:ring-1 focus:outline-none"
            />
          </div>
          <div className="text-xs text-gray-500">
            Showing{" "}
            <span className="text-brand-900 font-semibold">
              {filteredDevices.length}
            </span>{" "}
            of{" "}
            <span className="text-brand-900 font-semibold">
              {devices.length}
            </span>{" "}
            terminal(s)
          </div>
        </div>

        {/* Terminal Table / List */}
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            <div className="border-brand-500 mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-t-transparent" />
            Loading kiosk fleet...
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="py-16 text-center">
            <Monitor size={36} className="text-brand-300 mx-auto mb-2" />
            <p className="text-brand-900 text-sm font-semibold">
              {searchQuery
                ? "No matching kiosks found"
                : "No Kiosk Terminals Registered"}
            </p>
            <p className="text-brand-500 mx-auto mt-1 max-w-sm text-xs">
              {searchQuery
                ? `No terminals matched "${searchQuery}". Try a different keyword.`
                : "Register an Android touchscreen device to enable guest self check-in, dining orders, or kitchen displays."}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                icon={Plus}
                onClick={() => setCreateModalOpen(true)}
                className="mt-4"
              >
                Register First Terminal
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-surface-200 text-brand-600/70 bg-surface-50/50 border-b text-xs font-semibold tracking-wide uppercase">
                  <th className="px-6 py-3.5">Terminal & ID</th>
                  <th className="px-6 py-3.5">Preset & Location</th>
                  <th className="px-6 py-3.5">Pairing Key</th>
                  <th className="px-6 py-3.5">Status & Heartbeat</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-surface-200 divide-y">
                {filteredDevices.map((kiosk) => {
                  const presetMeta =
                    KIOSK_DASHBOARDS_METADATA[
                      kiosk.targetDashboard as keyof typeof KIOSK_DASHBOARDS_METADATA
                    ];
                  const isOnline = kiosk.status === "ONLINE";
                  const isMaintenance = kiosk.status === "MAINTENANCE";
                  const isOffline = kiosk.status === "OFFLINE";
                  const isCharging = kiosk.isCharging;

                  return (
                    <tr
                      key={kiosk._id || kiosk.id || kiosk.deviceId}
                      className="hover:bg-surface-50/60 transition-colors"
                    >
                      {/* Terminal Name & Device ID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              isOnline
                                ? "bg-emerald-50 text-emerald-700"
                                : isMaintenance
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            <Monitor size={18} />
                          </div>
                          <div>
                            <div className="text-brand-900 font-semibold">
                              {kiosk.name || "Kiosk Terminal"}
                            </div>
                            <div className="text-brand-500 mt-0.5 font-mono text-xs">
                              ID: {kiosk.deviceId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Preset & Location */}
                      <td className="px-6 py-4">
                        <div className="bg-brand-50 text-brand-800 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium">
                          {presetMeta?.name ||
                            kiosk.targetDashboard ||
                            "Check-In Kiosk"}
                        </div>
                        <div className="text-brand-500 mt-1 text-xs">
                          📍 {kiosk.location || "Main Lobby"}
                          {kiosk.tableId &&
                            ` • Table ${kiosk.tableId.tableNumber}`}
                          {kiosk.roomId && ` • Room ${kiosk.roomId.roomNumber}`}
                        </div>
                      </td>

                      {/* Pairing Key */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-surface-100 text-brand-900 rounded-md border px-2 py-1 font-mono text-xs font-bold tracking-wider">
                            {kiosk.pairCode || "PAIRED"}
                          </span>
                          <button
                            type="button"
                            title="Regenerate Pairing Key"
                            onClick={() => handleRegenerateCode(kiosk)}
                            className="text-brand-400 hover:text-brand-700 hover:bg-surface-100 rounded-md p-1 transition-colors"
                          >
                            <RefreshCw size={13} />
                          </button>
                        </div>
                      </td>

                      {/* Status, Battery & Last Heartbeat */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              isOnline
                                ? "border border-emerald-200/60 bg-emerald-50 text-emerald-700"
                                : isMaintenance
                                  ? "border border-amber-200/60 bg-amber-50 text-amber-700"
                                  : isOffline
                                    ? "border border-rose-200/60 bg-rose-50 text-rose-700"
                                    : "border border-gray-200 bg-gray-100 text-gray-700"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isOnline
                                  ? "animate-pulse bg-emerald-500"
                                  : isMaintenance
                                    ? "bg-amber-500"
                                    : isOffline
                                      ? "bg-rose-500"
                                      : "bg-gray-400"
                              }`}
                            />
                            {kiosk.status || "OFFLINE"}
                          </span>

                          {kiosk.batteryLevel != null && (
                            <span className="text-brand-600 inline-flex items-center gap-0.5 font-mono text-xs">
                              {isCharging ? (
                                <BatteryCharging
                                  size={13}
                                  className="text-emerald-600"
                                />
                              ) : (
                                <Battery size={13} className="text-brand-500" />
                              )}
                              {kiosk.batteryLevel}%
                            </span>
                          )}
                        </div>
                        <div className="text-brand-500 mt-1 text-[11px]">
                          Heartbeat:{" "}
                          {kiosk.lastHeartbeat
                            ? formatTime(kiosk.lastHeartbeat)
                            : "Never"}
                        </div>
                      </td>

                      {/* Quick Remote Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            title="Remote Reload Terminal App"
                            onClick={() => handleRemoteReload(kiosk)}
                            className="text-brand-500 hover:text-brand-800 hover:bg-surface-100 rounded-lg p-1.5 transition-colors"
                          >
                            <RotateCw size={14} />
                          </button>
                          <button
                            type="button"
                            title="Remote Exit Kiosk Mode (Return to Android Home)"
                            onClick={() => handleRemoteExitKiosk(kiosk)}
                            className="text-brand-500 rounded-lg p-1.5 transition-colors hover:bg-amber-50 hover:text-amber-700"
                          >
                            <LogOut size={14} />
                          </button>
                          <button
                            type="button"
                            title={
                              isMaintenance
                                ? "Exit Maintenance"
                                : "Enter Maintenance Mode"
                            }
                            onClick={() => handleToggleMaintenance(kiosk)}
                            className={`rounded-lg p-1.5 transition-colors ${
                              isMaintenance
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "text-brand-500 hover:bg-surface-100 hover:text-amber-700"
                            }`}
                          >
                            <Wrench size={14} />
                          </button>
                          <button
                            type="button"
                            title="Edit Terminal Settings"
                            onClick={() => setEditKiosk(kiosk)}
                            className="text-brand-500 hover:text-primary-700 hover:bg-surface-100 rounded-lg p-1.5 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            title="Delete Terminal"
                            onClick={() => setKioskToDelete(kiosk)}
                            className="text-brand-500 rounded-lg p-1.5 transition-colors hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Register Kiosk Terminal */}
      <CreateKioskModal
        open={createModalOpen}
        defaultHotelId={hotelId}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          showBanner("Terminal registered successfully.");
          refetch();
        }}
      />

      {/* MODAL: Edit Kiosk Terminal */}
      {editKiosk && (
        <EditKioskModal
          open={Boolean(editKiosk)}
          kiosk={editKiosk}
          onClose={() => setEditKiosk(null)}
          onUpdated={() => {
            showBanner(
              `Terminal "${editKiosk.name || editKiosk.deviceId}" updated successfully.`,
            );
            setEditKiosk(null);
            refetch();
          }}
        />
      )}

      {/* CONFIRM DIALOG: Delete Terminal */}
      <ConfirmDialog
        open={Boolean(kioskToDelete)}
        onClose={() => setKioskToDelete(null)}
        title="Delete Kiosk Terminal"
        message={`Are you sure you want to delete "${kioskToDelete?.name || kioskToDelete?.deviceId}"? The physical terminal will be unpaired and lose access.`}
        confirmLabel={deleting ? "Deleting..." : "Delete Terminal"}
        cancelLabel="Cancel"
        tone="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default HotelKiosksTab;
