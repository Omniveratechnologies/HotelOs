import React, { useState } from "react";
import {
  Header,
  KpiTile,
  KpiTileRow,
  InlineBanner,
} from "@hotelos/ui/components";
import {
  Monitor,
  Search,
  Wifi,
  WifiOff,
  Wrench,
  CheckCircle2,
  MapPin,
  Battery,
  ShieldCheck,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@hotelos/query";
import { getKioskDevices, updateKioskDevice } from "@hotelos/api";

export default function KioskDevicesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerVariant, setBannerVariant] = useState("success");

  const { data: responseData, isLoading } = useQuery({
    queryKey: ["kiosks", "list", { q: searchQuery }],
    queryFn: () => getKioskDevices({ q: searchQuery }),
    refetchInterval: 10000,
  });

  const devices = responseData?.devices || [];
  const stats = responseData?.stats || {
    total: 0,
    online: 0,
    offline: 0,
    maintenance: 0,
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateKioskDevice(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kiosks"] });
      setBannerVariant("success");
      setBannerMsg("Terminal status updated.");
      setTimeout(() => setBannerMsg(""), 3500);
    },
    onError: (err) => {
      setBannerVariant("error");
      setBannerMsg(err?.message || "Failed to update terminal status");
      setTimeout(() => setBannerMsg(""), 3500);
    },
  });

  return (
    <div className="bg-background-50/50 min-h-screen pb-24">
      <Header
        pageTitle="Kiosk Devices & Hardware Terminals"
        pageDescription="Monitor guest self-check-in touchscreen terminals, hardware health, and operational diagnostics"
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Info notice about Super Admin centralized control */}
        <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-800">
          <ShieldCheck className="h-5 w-5 shrink-0 text-sky-600" />
          <div>
            <span className="font-semibold">Centralized Fleet Management:</span>{" "}
            Terminal registration, physical device pairing keys, and dashboard
            assignments are centrally managed from the Super Admin dashboard.
          </div>
        </div>

        {/* KPI Row */}
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
            label="Maintenance Mode"
            value={stats.maintenance}
            icon={Wrench}
            iconClassName={
              stats.maintenance > 0
                ? "bg-amber-50 text-amber-700"
                : "bg-gray-100 text-gray-700"
            }
          />
        </KpiTileRow>

        {bannerMsg && (
          <InlineBanner variant={bannerVariant}>{bannerMsg}</InlineBanner>
        )}

        {/* Terminals Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              Lobby Kiosks ({devices.length})
            </h3>
            <div className="relative w-64">
              <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search kiosk ID, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="focus:border-brand-500 w-full rounded-lg border border-gray-200 py-1.5 pr-3 pl-8 text-xs focus:outline-none"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-sm text-gray-500">
              Loading terminal hardware...
            </div>
          ) : devices.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-xs">
              <Monitor className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-3 text-sm font-bold text-gray-900">
                No kiosk terminals configured for this hotel
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
                Contact your Super Administrator to provision and pair a
                touchscreen kiosk terminal in your lobby.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {devices.map((k) => (
                <div
                  key={k._id}
                  className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-brand-50 text-brand-700 rounded-xl p-2.5">
                          <Monitor className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">
                            {k.name}
                          </h4>
                          <span className="font-mono text-xs text-gray-500">
                            {k.deviceId}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          k.status === "ONLINE"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                            : k.status === "MAINTENANCE"
                              ? "border border-amber-200 bg-amber-50 text-amber-800"
                              : k.status === "DISABLED"
                                ? "border border-slate-200 bg-slate-100 text-slate-700"
                                : "border border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            k.status === "ONLINE"
                              ? "animate-pulse bg-emerald-500"
                              : k.status === "MAINTENANCE"
                                ? "bg-amber-500"
                                : k.status === "DISABLED"
                                  ? "bg-slate-400"
                                  : "bg-rose-500"
                          }`}
                        />
                        {k.status === "ONLINE"
                          ? "ONLINE (Connected)"
                          : k.status === "MAINTENANCE"
                            ? "MAINTENANCE"
                            : k.status === "DISABLED"
                              ? "DISABLED"
                              : "OFFLINE (Disconnected)"}
                      </span>
                    </div>

                    <div className="space-y-1.5 border-t border-gray-100 pt-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        <span>{k.location || "Lobby"}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Pairing Status:</span>
                        <span className="font-semibold text-gray-800">
                          {k.isPaired ? "Paired & Active" : "Awaiting Setup"}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Dashboard Mode:</span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-800">
                          {k.targetDashboard || "DEMO_URL"}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Firmware:</span>
                        <span>{k.firmwareVersion || "v1.4.0"}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Last Heartbeat:</span>
                        <span>
                          {k.lastHeartbeat
                            ? new Date(k.lastHeartbeat).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Online"}
                        </span>
                      </div>
                      {typeof k.batteryLevel === "number" && (
                        <div className="flex justify-between text-gray-500">
                          <span>Battery:</span>
                          <span className="flex items-center gap-1">
                            <Battery className="h-3 w-3 text-gray-500" />
                            {Math.round(k.batteryLevel * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end border-t border-gray-100 pt-3 text-xs">
                    <div className="flex items-center gap-2">
                      {k.status === "MAINTENANCE" ? (
                        <button
                          type="button"
                          disabled={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: k._id,
                              status: "ONLINE",
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 font-semibold text-emerald-700 shadow-xs hover:bg-emerald-100 disabled:opacity-50"
                          title="Turn off maintenance mode and restore normal kiosk operations"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Turn Off Maintenance
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: k._id,
                              status: "MAINTENANCE",
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 font-semibold text-amber-800 shadow-xs hover:bg-amber-100 disabled:opacity-50"
                          title="Turn on maintenance mode to lock down the kiosk"
                        >
                          <Wrench className="h-3.5 w-3.5 text-amber-600" />
                          Turn On Maintenance
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
