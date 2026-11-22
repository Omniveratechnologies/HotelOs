import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiCpu, FiPlus } from "react-icons/fi";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/hamburger/SideBar.jsx";
import ActionButton from "../../components/ui/button/ActionButton.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Toast from "../../components/ui/Toast.jsx";

import DeviceStatusCards from "../../components/attendance/DeviceStatusCards.jsx";
import DeviceTable from "../../components/attendance/DeviceTable.jsx";
import DeviceStatusDonut from "../../components/attendance/DeviceStatusDonut.jsx";
import DeviceTypeBars from "../../components/attendance/DeviceTypeBars.jsx";
import DeviceActivity from "../../components/attendance/DeviceActivity.jsx";
import DeviceFloorMap from "../../components/attendance/DeviceFloorMap.jsx";
import DeviceQuickActions from "../../components/attendance/DeviceQuickActions.jsx";
import DeviceFormModal from "../../components/attendance/DeviceFormModal.jsx";
import DeviceTokenModal from "../../components/attendance/DeviceTokenModal.jsx";
import DevicePickerModal from "../../components/attendance/DevicePickerModal.jsx";
import DeviceDetailModal from "../../components/attendance/DeviceDetailModal.jsx";

import {
  createDevice,
  deleteDevice,
  fetchDeviceSummary,
  regenerateDeviceToken,
  sendDeviceCommand,
  syncAllDevices,
  updateDevice,
} from "../../services/deviceApi.js";
import useDeviceSocket from "../../hooks/useDeviceSocket.js";
import useDebounce from "../../hooks/useDebounce.js";
import { useIsWide } from "../../hooks/useIsWide.js";
import { COMMAND_LABELS } from "../../utils/deviceFormat.js";

const FLOOR_PLAN_URL = import.meta.env?.VITE_FLOOR_PLAN_URL || "";

const AttendanceDevices = () => {
  const isWide = useIsWide("(min-width: 1360px)");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [status, setStatus] = useState("ALL");
  const [view, setView] = useState({
    page: 1,
    limit: 10,
    sort: "name",
    direction: "asc",
  });

  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [formDevice, setFormDevice] = useState(undefined);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [detail, setDetail] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [regenerating, setRegenerating] = useState(null);
  const [picker, setPicker] = useState(null);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [savingPins, setSavingPins] = useState(false);
  const [toast, setToast] = useState(null);

  const closeToast = useCallback(() => setToast(null), []);
  const showToast = useCallback(
    (type, message) => setToast({ type, message }),
    [],
  );
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetchDeviceSummary(
      { search: debouncedSearch.trim(), status, ...view },
      controller.signal,
    )
      .then((body) => {
        const next = body.pagination || {
          page: 1,
          limit: view.limit,
          total: 0,
          totalPages: 1,
        };
        setSummary(body.data);
        setPagination(next);

        if (
          (body.data.devices || []).length === 0 &&
          next.total > 0 &&
          view.page > next.totalPages
        ) {
          setView((previous) => ({ ...previous, page: next.totalPages }));
        }
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedSearch, status, view, refreshKey]);

  const refreshTimer = useRef(null);
  const refreshSoon = useCallback(() => {
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(refresh, 400);
  }, [refresh]);
  useEffect(() => () => clearTimeout(refreshTimer.current), []);

  const { connected } = useDeviceSocket({
    onEvent: (event) => {
      const name = event.device?.name || "A device";
      if (event.type === "ALERT") showToast("error", event.message);
      else if (event.type === "OFFLINE")
        showToast("error", `${name} went offline`);
      else if (event.type === "WARNING")
        showToast("error", `${name}: connection unstable`);
      else if (event.type === "ONLINE")
        showToast("success", `${name} is back online`);
      refreshSoon();
    },
    onCommand: (command) => {
      if (["ACKED", "FAILED", "TIMEOUT"].includes(command.status)) {
        const label = COMMAND_LABELS[command.type] || command.type;
        const device =
          summary?.map?.find((item) => item._id === command.deviceId)?.name ||
          "the device";
        const message = command.result?.message
          ? `: ${command.result.message}`
          : "";
        showToast(
          command.status === "ACKED" ? "success" : "error",
          `${label} on ${device} ${command.status === "ACKED" ? "done" : "failed"}${message}`,
        );
        refreshSoon();
      }
    },
  });

  useEffect(() => {
    if (connected) return undefined;
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, [connected, refresh]);

  const handleSort = (key) =>
    setView((previous) => ({
      ...previous,
      sort: key,
      direction:
        previous.sort === key && previous.direction === "asc" ? "desc" : "asc",
      page: 1,
    }));

  const handleSubmit = async (values) => {
    if (formDevice) {
      await updateDevice(formDevice._id, values);
      setFormDevice(undefined);
      showToast("success", "Device updated");
    } else {
      const created = await createDevice(values);
      setFormDevice(undefined);
      setTokenInfo({ device: created, token: created.deviceToken });
      showToast("success", `${created.name} added`);
    }
    refresh();
  };

  const handleCommand = async (device, type) => {
    try {
      await sendDeviceCommand(device._id, type);
      showToast("success", `${COMMAND_LABELS[type]} sent to ${device.name}`);
    } catch (requestError) {
      showToast("error", requestError.message);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const result = await syncAllDevices();
      showToast(
        "success",
        result.queued === 0
          ? "No live device to sync"
          : `Sync sent to ${result.queued} device${result.queued === 1 ? "" : "s"}${result.skippedOffline ? ` (${result.skippedOffline} offline skipped)` : ""}`,
      );
    } catch (requestError) {
      showToast("error", requestError.message);
    } finally {
      setSyncing(false);
    }
  };

  const confirmRemove = async () => {
    setBusy(true);
    try {
      await deleteDevice(removing._id);
      showToast("success", `${removing.name} removed`);
      setRemoving(null);
      setDetail(null);
      refresh();
    } catch (requestError) {
      showToast("error", requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmRegenerate = async () => {
    setBusy(true);
    try {
      const result = await regenerateDeviceToken(regenerating._id);
      setTokenInfo({ device: regenerating, token: result.deviceToken });
      setRegenerating(null);
    } catch (requestError) {
      showToast("error", requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const savePins = async (changes) => {
    setSavingPins(true);
    try {
      await Promise.all(
        changes.map(({ id, mapX, mapY }) => updateDevice(id, { mapX, mapY })),
      );
      showToast("success", "Floor plan saved");
      refresh();
      return true;
    } catch (requestError) {
      showToast("error", requestError.message);
      return false;
    } finally {
      setSavingPins(false);
    }
  };

  const mapDevices = summary?.map || [];
  const liveDevices = useMemo(
    () => mapDevices.filter((device) => device.status !== "OFFLINE"),
    [mapDevices],
  );
  const hasActiveFilters = Boolean(debouncedSearch.trim() || status !== "ALL");

  const fullRow = (slim) =>
    summary?.devices?.find((device) => device._id === slim._id) || slim;

  const openFromRow = (device) => setDetail(fullRow(device));

  const side = (
    <>
      <DeviceStatusDonut stats={summary?.stats} />
      <DeviceTypeBars stats={summary?.stats} />
      <DeviceActivity activity={summary?.activity} loading={loading} />
    </>
  );

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-[margin] duration-300 ease-in-out ${isMenuOpen ? "ml-64" : "ml-0"}`}
      >
        <Navbar
          icon={<FiCpu />}
          iconColor="text-emerald-500"
          bgColor="bg-emerald-500/10"
          title="Attendance Devices"
          subtitle="Manage and monitor all attendance devices across your hotel."
          breadcrumb="Dashboard → Attendance → Attendance Devices"
          placeholder="Search devices..."
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          showPageHeading
          pageAction={
            <div className="flex items-center gap-3">
              <span
                title={
                  connected
                    ? "Receiving live updates"
                    : "Reconnecting - the page refreshes every 30 seconds meanwhile"
                }
                className={`hidden items-center gap-1.5 text-[11px] sm:inline-flex ${connected ? "text-emerald-400" : "text-yellow-400"}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-yellow-400"}`}
                />
                {connected ? "Live" : "Reconnecting"}
              </span>
              <ActionButton
                icon={<FiPlus size={14} />}
                onClick={() => setFormDevice(null)}
              >
                Add Device
              </ActionButton>
            </div>
          }
        />

        <main className="space-y-5 px-4 py-5">
          <DeviceStatusCards stats={summary?.stats} />

          <div
            className={
              isWide
                ? "grid grid-cols-[minmax(0,1fr)_320px] items-start gap-5"
                : "space-y-5"
            }
          >
            <div className="min-w-0 space-y-5">
              <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#111111]">
                <DeviceTable
                  devices={summary?.devices || []}
                  loading={loading}
                  error={error}
                  onRetry={refresh}
                  pagination={pagination}
                  onPageChange={(page) =>
                    setView((previous) => ({ ...previous, page }))
                  }
                  onLimitChange={(limit) =>
                    setView((previous) => ({ ...previous, limit, page: 1 }))
                  }
                  search={search}
                  onSearchChange={(value) => {
                    setSearch(value);
                    setView((previous) => ({ ...previous, page: 1 }));
                  }}
                  status={status}
                  onStatusChange={(value) => {
                    setStatus(value);
                    setView((previous) => ({ ...previous, page: 1 }));
                  }}
                  hasActiveFilters={hasActiveFilters}
                  sortBy={view.sort}
                  sortDirection={view.direction}
                  onSort={handleSort}
                  onView={openFromRow}
                  onEdit={(device) => setFormDevice(device)}
                  onCommand={handleCommand}
                  onRegenerate={setRegenerating}
                  onRemove={setRemoving}
                />
              </div>

              <div className="grid items-stretch gap-5 md:grid-cols-2">
                <DeviceFloorMap
                  devices={mapDevices}
                  imageUrl={FLOOR_PLAN_URL}
                  onSelect={openFromRow}
                  onSavePins={savePins}
                  saving={savingPins}
                />
                <DeviceQuickActions
                  onAdd={() => setFormDevice(null)}
                  onTest={() => setPicker("test")}
                  onSyncAll={handleSyncAll}
                  onSettings={() => setPicker("settings")}
                  syncing={syncing}
                />
              </div>
            </div>

            <div
              className={
                isWide
                  ? "min-w-0 space-y-5"
                  : "grid min-w-0 gap-5 md:grid-cols-2"
              }
            >
              {side}
            </div>
          </div>
        </main>
      </div>

      <DeviceDetailModal
        open={Boolean(detail)}
        device={detail}
        refreshKey={refreshKey}
        onClose={() => setDetail(null)}
        onCommand={handleCommand}
        onEdit={(device) => {
          setDetail(null);
          setFormDevice(device);
        }}
        onRegenerate={(device) => {
          setDetail(null);
          setRegenerating(device);
        }}
        onRemove={(device) => {
          setDetail(null);
          setRemoving(device);
        }}
      />

      <DeviceFormModal
        open={formDevice !== undefined}
        device={formDevice || null}
        onClose={() => setFormDevice(undefined)}
        onSubmit={handleSubmit}
      />

      <DeviceTokenModal
        open={Boolean(tokenInfo)}
        device={tokenInfo?.device}
        token={tokenInfo?.token}
        onClose={() => setTokenInfo(null)}
      />

      <DevicePickerModal
        open={Boolean(picker)}
        title={picker === "test" ? "Test Connection" : "Device Settings"}
        actionLabel={picker === "test" ? "Test now" : "Open settings"}
        devices={picker === "test" ? liveDevices : mapDevices}
        onClose={() => setPicker(null)}
        onPick={(device) => {
          const mode = picker;
          setPicker(null);
          if (mode === "test") handleCommand(device, "TEST_CONNECTION");
          else setFormDevice(fullRow(device));
        }}
      />

      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove device"
        message={`Remove ${removing?.name}? It stops receiving commands and its token stops working. Past attendance records are kept.`}
        confirmLabel="Remove"
        loading={busy}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />

      <ConfirmDialog
        open={Boolean(regenerating)}
        title="New device token"
        message={`${regenerating?.name} will stop working until the new token is entered on the device. Continue?`}
        confirmLabel="Create new token"
        variant="primary"
        loading={busy}
        onConfirm={confirmRegenerate}
        onCancel={() => setRegenerating(null)}
      />

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
};

export default AttendanceDevices;
