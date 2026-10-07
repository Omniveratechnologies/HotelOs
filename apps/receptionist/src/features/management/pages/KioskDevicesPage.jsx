import React, { useState } from "react";
import {
  Header,
  KpiTile,
  KpiTileRow,
  Button,
  InlineBanner,
  Input,
} from "@hotelos/ui/components";
import {
  Monitor,
  Plus,
  Search,
  Wifi,
  WifiOff,
  Wrench,
  RotateCcw,
  Trash2,
  X,
  MapPin,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@hotelos/query";
import {
  getKioskDevices,
  createKioskDevice,
  updateKioskDevice,
  regenerateKioskPairCode,
  deleteKioskDevice,
} from "@hotelos/api";

export default function KioskDevicesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerVariant, setBannerVariant] = useState("success");

  // Form state
  const [formData, setFormData] = useState({
    deviceId: "",
    name: "",
    location: "Main Lobby - East Entrance",
    firmwareVersion: "v1.4.0",
  });

  const { data: responseData, isLoading } = useQuery({
    queryKey: ["kiosks", "list", { q: searchQuery }],
    queryFn: () => getKioskDevices({ q: searchQuery }),
  });

  const devices = responseData?.devices || [];
  const stats = responseData?.stats || {
    total: 0,
    online: 0,
    offline: 0,
    maintenance: 0,
  };

  const createMutation = useMutation({
    mutationFn: (body) => createKioskDevice(body),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["kiosks"] });
      setBannerVariant("success");
      setBannerMsg(
        `Terminal "${res.name}" registered with pairing code ${res.pairCode}!`,
      );
      setModalOpen(false);
      setFormData({
        deviceId: "",
        name: "",
        location: "Main Lobby - East Entrance",
        firmwareVersion: "v1.4.0",
      });
      setTimeout(() => setBannerMsg(""), 5000);
    },
    onError: (err) => {
      setBannerVariant("error");
      setBannerMsg(err?.message || "Failed to register kiosk");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateKioskDevice(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kiosks"] });
      setBannerVariant("success");
      setBannerMsg("Terminal status updated.");
      setTimeout(() => setBannerMsg(""), 3500);
    },
  });

  const pairCodeMutation = useMutation({
    mutationFn: (id) => regenerateKioskPairCode(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["kiosks"] });
      setBannerVariant("success");
      setBannerMsg(`New terminal pairing code: ${res.pairCode}`);
      setTimeout(() => setBannerMsg(""), 5000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteKioskDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kiosks"] });
      setBannerVariant("success");
      setBannerMsg("Kiosk terminal deleted.");
      setTimeout(() => setBannerMsg(""), 3500);
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="bg-background-50/50 min-h-screen pb-24">
      <Header
        pageTitle="Kiosk Devices & Hardware Terminals"
        pageDescription="Manage guest self-check-in touchscreen kiosks, terminal health, pairing keys, and diagnostics"
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setModalOpen(true)}
        >
          Register Kiosk Terminal
        </Button>
      </Header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
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
              Registered Kiosks ({devices.length})
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
                No kiosk terminals configured
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
                Connect touchscreen kiosks in your lobby for guests to check in
                and collect key cards automatically.
              </p>
              <div className="mt-5">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setModalOpen(true)}
                >
                  Add First Kiosk Terminal
                </Button>
              </div>
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
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          k.status === "ONLINE"
                            ? "bg-emerald-100 text-emerald-800"
                            : k.status === "MAINTENANCE"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {k.status === "ONLINE" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        )}
                        {k.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 border-t border-gray-100 pt-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        <span>{k.location || "Lobby"}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Pairing Code:</span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono font-bold text-gray-800">
                          {k.pairCode || "None"}
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
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => pairCodeMutation.mutate(k._id)}
                      className="text-brand-600 hover:text-brand-800 flex items-center gap-1 font-semibold"
                      title="Generate new pairing code"
                    >
                      <RotateCcw className="h-3 w-3" /> New Pair Code
                    </button>

                    <div className="flex items-center gap-2">
                      {k.status === "ONLINE" ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: k._id,
                              status: "MAINTENANCE",
                            })
                          }
                          className="rounded bg-amber-50 px-2 py-1 font-medium text-amber-700 hover:bg-amber-100"
                        >
                          Maintenance
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: k._id,
                              status: "ONLINE",
                            })
                          }
                          className="rounded bg-emerald-50 px-2 py-1 font-medium text-emerald-700 hover:bg-emerald-100"
                        >
                          Set Online
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove kiosk ${k.name}?`)) {
                            deleteMutation.mutate(k._id);
                          }
                        }}
                        className="rounded p-1 text-gray-400 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Register Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Register Kiosk Terminal
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <Input
                  label="Device ID / Serial Number *"
                  value={formData.deviceId}
                  onChange={(e) =>
                    setFormData({ ...formData, deviceId: e.target.value })
                  }
                  placeholder="e.g. KIOSK-LOBBY-01"
                  required
                />
              </div>

              <div>
                <Input
                  label="Terminal Display Name *"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Main Lobby Touchscreen 1"
                  required
                />
              </div>

              <div>
                <Input
                  label="Physical Location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g. Ground Floor East Lobby"
                />
              </div>

              <div>
                <Input
                  label="Firmware / App Version"
                  value={formData.firmwareVersion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      firmwareVersion: e.target.value,
                    })
                  }
                  placeholder="v1.4.0"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  Register & Generate Pair Code
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
