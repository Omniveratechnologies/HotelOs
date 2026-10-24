import { useState, useMemo } from "react";
import {
  Monitor,
  Plus,
  Search,
  Wifi,
  WifiOff,
  Wrench,
  ShieldAlert,
  RotateCcw,
  RotateCw,
  LogOut,
  Pencil,
  Trash2,
  Building2,
  Battery,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Header, Button, KpiTile, KpiTileRow } from "@hotelos/ui/components";
import {
  useKiosks,
  useRegeneratePairCode,
  useSendKioskCommand,
  useUpdateKiosk,
  useDeleteKiosk,
} from "../hooks/useKiosks.js";
import { useHotels } from "../../hotels/hooks/useHotels.js";
import CreateKioskModal from "../components/CreateKioskModal.jsx";
import EditKioskModal from "../components/EditKioskModal.jsx";

const DASHBOARD_LABELS = {
  DEMO_PORTAL: "Interactive Demo",
  GUEST_CHECKIN: "Guest Check-in",
  TABLE_ORDER: "Table Ordering",
  RECEPTIONIST_EXPRESS: "Express Reception",
  CUSTOM_URL: "Custom Web",
};

export default function KioskDevicesPage() {
  const { hotels } = useHotels();

  const [selectedHotelId, setSelectedHotelId] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editKiosk, setEditKiosk] = useState(null);
  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerVariant, setBannerVariant] = useState("success");

  const filters = useMemo(() => {
    const f = {};
    if (selectedHotelId !== "ALL") f.hotelId = selectedHotelId;
    if (searchQuery.trim()) f.q = searchQuery.trim();
    return f;
  }, [selectedHotelId, searchQuery]);

  const { devices, stats, isLoading } = useKiosks(filters);
  const regeneratePairCodeMutation = useRegeneratePairCode();
  const sendCommandMutation = useSendKioskCommand();
  const updateKioskMutation = useUpdateKiosk();
  const deleteKioskMutation = useDeleteKiosk();

  function showBanner(msg, variant = "success") {
    setBannerMsg(msg);
    setBannerVariant(variant);
    setTimeout(() => setBannerMsg(""), 4500);
  }

  async function handleRegenerateCode(kioskId) {
    try {
      const res = await regeneratePairCodeMutation.mutateAsync(kioskId);
      showBanner(`New pairing code generated: ${res.pairCode}`);
    } catch (err) {
      showBanner(err?.message || "Failed to generate pairing code", "error");
    }
  }

  async function handleRemoteReload(kiosk) {
    try {
      await sendCommandMutation.mutateAsync({
        id: kiosk._id,
        command: "device:reload",
      });
      showBanner(`Reload command dispatched to terminal "${kiosk.name}".`);
    } catch (err) {
      showBanner(err?.message || "Failed to dispatch reload command", "error");
    }
  }

  async function handleRemoteExitKiosk(kiosk) {
    if (
      !window.confirm(
        `Are you sure you want to remotely exit kiosk mode on "${kiosk.name}" (${kiosk.deviceId})? The physical tablet will exit lock task mode and return to the home screen.`,
      )
    ) {
      return;
    }
    try {
      await sendCommandMutation.mutateAsync({
        id: kiosk._id,
        command: "device:exit-kiosk",
        payload: { reason: "Remotely requested by Super Admin" },
      });
      showBanner(`Exit Kiosk command dispatched to terminal "${kiosk.name}".`);
    } catch (err) {
      showBanner(err?.message || "Failed to dispatch exit command", "error");
    }
  }

  async function handleToggleMaintenance(kiosk) {
    const nextStatus =
      kiosk.status === "MAINTENANCE" ? "ONLINE" : "MAINTENANCE";
    try {
      await updateKioskMutation.mutateAsync({
        id: kiosk._id,
        data: { status: nextStatus },
      });
      showBanner(`Terminal "${kiosk.name}" status updated to ${nextStatus}.`);
    } catch (err) {
      showBanner(err?.message || "Failed to update terminal status", "error");
    }
  }

  async function handleDelete(kiosk) {
    if (
      !window.confirm(
        `Are you sure you want to remove terminal "${kiosk.name}" (${kiosk.deviceId})?`,
      )
    ) {
      return;
    }
    try {
      await deleteKioskMutation.mutateAsync(kiosk._id);
      showBanner("Kiosk terminal removed successfully.");
    } catch (err) {
      showBanner(err?.message || "Failed to remove terminal", "error");
    }
  }

  return (
    <div className="bg-background-50/50 min-h-screen pb-24">
      <Header
        pageTitle="Kiosks & Hardware Terminals"
        pageDescription="Centralized fleet management, one-time pairing, hotel reassignment, and remote control for Android kiosk tablets"
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setCreateModalOpen(true)}
        >
          Register Terminal
        </Button>
      </Header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {bannerMsg && (
          <div
            className={`rounded-xl p-4 text-sm font-semibold shadow-sm ${
              bannerVariant === "error"
                ? "border border-rose-200 bg-rose-50 text-rose-800"
                : "border border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {bannerMsg}
          </div>
        )}

        {/* KPI Tile Row */}
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

        {/* Filter Toolbar */}
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Hotel Selector */}
            <div className="w-full sm:w-64">
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:ring-1 focus:outline-none"
              >
                <option value="ALL">All Associated Hotels</option>
                {hotels.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name} {h.city ? `(${h.city})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Device ID, name, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-lg border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm text-gray-800 shadow-sm focus:ring-1 focus:outline-none"
              />
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Showing <span className="font-semibold">{devices.length}</span>{" "}
            hardware terminal(s)
          </div>
        </div>

        {/* Terminals Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="border-brand-500 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          </div>
        ) : devices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <Monitor className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-3 text-base font-semibold text-gray-900">
              No kiosk terminals found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Register a touchscreen terminal for an associated hotel to get
              started.
            </p>
            <div className="mt-4">
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setCreateModalOpen(true)}
              >
                Register First Terminal
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((kiosk) => {
              const hotel = kiosk.hotelId;
              const isOnline = kiosk.status === "ONLINE";
              const isMaintenance = kiosk.status === "MAINTENANCE";
              const isDisabled = kiosk.status === "DISABLED";

              return (
                <div
                  key={kiosk._id}
                  className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Header: Name, DeviceId, Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {kiosk.name}
                        </h4>
                        <span className="font-mono text-xs font-semibold text-gray-500">
                          {kiosk.deviceId}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
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
                          className={`h-2 w-2 rounded-full ${
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
                          ? "ONLINE (Connected)"
                          : isMaintenance
                            ? "MAINTENANCE"
                            : isDisabled
                              ? "DISABLED"
                              : "OFFLINE (Disconnected)"}
                      </span>
                    </div>

                    {/* Hotel Association Badge */}
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 text-xs">
                      <Building2 className="text-brand-600 h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-gray-900">
                          {hotel?.name || "Unassigned Hotel"}
                        </p>
                        {hotel?.city && (
                          <p className="text-gray-500">{hotel.city}</p>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Diagnostics */}
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Dashboard Mode:</span>
                        <span className="rounded bg-sky-50 px-2 py-0.5 font-semibold text-sky-800">
                          {DASHBOARD_LABELS[kiosk.targetDashboard] ||
                            kiosk.targetDashboard}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span className="flex items-center gap-1 font-medium text-gray-800">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {kiosk.location || "Main Lobby"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Pairing State:</span>
                        {kiosk.isPaired ? (
                          <span className="flex items-center gap-1 font-semibold text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Paired
                            (Active)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-semibold text-amber-600">
                            <AlertCircle className="h-3.5 w-3.5" /> Awaiting
                            Setup
                          </span>
                        )}
                      </div>

                      {kiosk.pairCode && (
                        <div className="flex items-center justify-between rounded bg-amber-50 p-1.5">
                          <span className="font-medium text-amber-900">
                            One-Time Pair Code:
                          </span>
                          <span className="font-mono font-bold tracking-wider text-amber-900">
                            {kiosk.pairCode}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Last Heartbeat:</span>
                        <span>
                          {kiosk.lastHeartbeat
                            ? new Date(kiosk.lastHeartbeat).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "—"}
                        </span>
                      </div>

                      {typeof kiosk.batteryLevel === "number" && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Battery:</span>
                          <span className="flex items-center gap-1 font-medium text-gray-700">
                            <Battery className="h-3.5 w-3.5 text-gray-500" />
                            {Math.round(kiosk.batteryLevel * 100)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Remote Hardware Controls Bar */}
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs">
                      <span className="font-semibold text-gray-600">
                        Remote:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {kiosk.status === "MAINTENANCE" ? (
                          <button
                            type="button"
                            onClick={() => handleToggleMaintenance(kiosk)}
                            disabled={updateKioskMutation.isPending}
                            className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 font-semibold text-emerald-700 shadow-xs hover:bg-emerald-100 disabled:opacity-50"
                            title="Turn off maintenance mode and restore normal kiosk operations"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />{" "}
                            Turn Off Maintenance
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleMaintenance(kiosk)}
                            disabled={updateKioskMutation.isPending}
                            className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 font-semibold text-amber-800 shadow-xs hover:bg-amber-100 disabled:opacity-50"
                            title="Turn on maintenance mode to lock down the kiosk"
                          >
                            <Wrench className="h-3 w-3 text-amber-600" /> Turn
                            On Maintenance
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoteReload(kiosk)}
                          disabled={sendCommandMutation.isPending}
                          className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 font-medium text-gray-700 shadow-xs hover:bg-gray-100 disabled:opacity-50"
                          title="Reload WebView on device"
                        >
                          <RotateCw className="h-3 w-3 text-gray-500" /> Reload
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoteExitKiosk(kiosk)}
                          disabled={sendCommandMutation.isPending}
                          className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1 font-semibold text-rose-700 shadow-xs hover:bg-rose-100 disabled:opacity-50"
                          title="Exit Kiosk Mode on physical tablet (unpins app)"
                        >
                          <LogOut className="h-3 w-3 text-rose-600" /> Exit
                          Kiosk
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => handleRegenerateCode(kiosk._id)}
                      className="text-brand-600 hover:text-brand-800 inline-flex items-center gap-1 font-semibold"
                      title="Issue new pairing code"
                    >
                      <RotateCcw className="h-3 w-3" /> New Pair Code
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditKiosk(kiosk)}
                        className="inline-flex items-center gap-1 rounded bg-gray-100 px-2.5 py-1 font-semibold text-gray-700 hover:bg-gray-200"
                      >
                        <Pencil className="h-3 w-3" /> Configure
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(kiosk)}
                        className="rounded p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Remove terminal"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateKioskModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(created) => {
          showBanner(
            `Terminal "${created.name}" registered with pairing code ${created.pairCode}!`,
          );
        }}
      />

      <EditKioskModal
        kiosk={editKiosk}
        open={Boolean(editKiosk)}
        onClose={() => setEditKiosk(null)}
        onUpdated={(updated) => {
          showBanner(`Terminal "${updated.name}" updated successfully.`);
        }}
      />
    </div>
  );
}
