import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import {
  Cable,
  Save,
  RefreshCw,
  PlugZap,
  Building2,
  Pencil,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import Field from "../../components/ui/Field.jsx";
import { inputClass } from "../../components/ui/inputClass.js";
import Button from "../../components/ui/Button.jsx";
import { TableSkeleton } from "../../components/ui/States.jsx";
import {
  getHotels,
  getHotelById,
  getChannelManagerConfig,
  updateChannelManagerConfig,
  setHotelAiosellCode,
  syncHotelFromAiosell,
} from "../../services/hotel.service.js";
import AiosellLiveMatrix from "../../components/channel-manager/AiosellLiveMatrix.jsx";

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <div className="border-surface-200 rounded-2xl border bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="bg-primary-100 text-primary-600 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <Icon size={17} strokeWidth={2.25} />
        </div>
        <div>
          <h3 className="font-display text-brand-900 font-bold">{title}</h3>
          {description && (
            <p className="text-brand-700/60 mt-0.5 text-sm">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span>
        <span className="text-brand-900 block text-sm font-semibold">
          {label}
        </span>
        {description && (
          <span className="text-brand-700/60 block text-xs">{description}</span>
        )}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary-500" : "bg-brand-950/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function ChannelManagerPage() {
  const { onMenuClick } = useOutletContext();

  const [hotels, setHotels] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [viewTab, setViewTab] = useState("matrix"); // "matrix" | "settings"

  const [config, setConfig] = useState(null);
  const [pmsSlug, setPmsSlug] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  const [hotelAiosellCode, setHotelAiosellCodeValue] = useState("");
  const [codeSaving, setCodeSaving] = useState(false);
  const [syncRunning, setSyncRunning] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const [toast, setToast] = useState(null);

  const loadConfig = async () => {
    try {
      const data = await getChannelManagerConfig();
      setConfig(data);
      setPmsSlug(data?.pmsSlug || "");
      setUsername("");
      setPassword("");
      setBaseUrl(data?.baseUrl || "");
      setIsEnabled(!!data?.isEnabled);
    } catch (err) {
      console.error("Failed to load channel config:", err);
      setToast({ ok: false, message: err.message || "Failed to load config" });
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getHotels();
        setHotels(data);
        if (data[0]) {
          setSelectedHotelId(data[0]._id);
          setHotelAiosellCodeValue(data[0].aiosellHotelCode || "");
        }
      } catch (err) {
        console.error("Failed to load hotels:", err);
        setToast({
          ok: false,
          message: err.message || "Failed to load hotels",
        });
      } finally {
        setHotelsLoading(false);
      }
    })();
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (ok, message) => {
    setToast({ ok, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setConfigSaving(true);
    setToast(null);
    try {
      const payload = { isEnabled };
      if (pmsSlug.trim()) payload.pmsSlug = pmsSlug.trim();
      if (username.trim()) payload.username = username.trim();
      if (password.trim()) payload.password = password;
      if (baseUrl.trim()) payload.baseUrl = baseUrl.trim();
      const result = await updateChannelManagerConfig(payload);
      showToast(true, result.message || "Channel manager config saved");
      setPassword("");
      await loadConfig();
    } catch (err) {
      console.error("Failed to save config:", err);
      showToast(false, err.message || "Failed to save config");
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSelectHotel = async (hotelId) => {
    setSelectedHotelId(hotelId);
    setSyncResult(null);
    try {
      const hotel = await getHotelById(hotelId);
      setHotelAiosellCodeValue(hotel.aiosellHotelCode || "");
    } catch (err) {
      console.error("Failed to load hotel:", err);
      showToast(false, err.message || "Failed to load hotel");
    }
  };

  const handleSaveAiosellCode = async () => {
    if (!selectedHotelId) return;
    setCodeSaving(true);
    setToast(null);
    try {
      await setHotelAiosellCode(selectedHotelId, hotelAiosellCode.trim());
      showToast(true, "Aiosell property code updated");
    } catch (err) {
      console.error("Failed to update Aiosell code:", err);
      showToast(false, err.message || "Failed to update Aiosell code");
    } finally {
      setCodeSaving(false);
    }
  };

  const handleSync = async () => {
    if (!selectedHotelId) return;
    const confirmed = window.confirm(
      "This replaces the selected hotel's rooms, rate plans and approvals with the mapping pulled from Aiosell, then pushes availability + rates back. Continue?",
    );
    if (!confirmed) return;

    setSyncRunning(true);
    setSyncResult(null);
    setToast(null);
    try {
      const result = await syncHotelFromAiosell(selectedHotelId);
      setSyncResult(result.data);
      showToast(true, result.message || "Synced from Aiosell");
      await loadConfig();
    } catch (err) {
      console.error("Sync from Aiosell failed:", err);
      showToast(false, err.message || "Sync from Aiosell failed");
    } finally {
      setSyncRunning(false);
    }
  };

  const selectedHotel = hotels.find(
    (h) => String(h._id) === String(selectedHotelId),
  );

  return (
    <>
      <Topbar
        title="Channel Manager"
        subtitle="Live Aiosell rates & inventory distribution, property sync, and settings."
        onMenuClick={onMenuClick}
      />

      <main className="flex-1 space-y-5 px-5 pb-10 lg:px-8">
        {/* Top Control Bar: Hotel Selector + Primary Tabs */}
        <div className="border-surface-200 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold tracking-wider text-gray-500 uppercase">
              Target Property:
            </label>
            <select
              value={selectedHotelId}
              onChange={(e) => {
                setSelectedHotelId(e.target.value);
                const h = hotels.find((item) => item._id === e.target.value);
                setHotelAiosellCodeValue(h?.aiosellHotelCode || "");
              }}
              disabled={hotelsLoading}
              className="border-surface-200 text-brand-900 rounded-xl border px-3 py-1.5 text-xs font-semibold focus:outline-none"
            >
              {hotels.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name}{" "}
                  {h.aiosellHotelCode
                    ? `(${h.aiosellHotelCode})`
                    : "(Unmapped)"}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-brand-950/5 flex items-center gap-1 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setViewTab("matrix")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewTab === "matrix"
                  ? "text-brand-900 bg-white shadow-xs"
                  : "text-brand-700/60 hover:text-brand-900"
              }`}
            >
              Live Aiosell Matrix
            </button>
            <button
              type="button"
              onClick={() => setViewTab("settings")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewTab === "settings"
                  ? "text-brand-900 bg-white shadow-xs"
                  : "text-brand-700/60 hover:text-brand-900"
              }`}
            >
              Connection & Sync Settings
            </button>
          </div>
        </div>

        {toast && (
          <div
            className={`mb-2 rounded-xl px-4 py-3 text-sm ${
              toast.ok
                ? "bg-primary-100 text-primary-600"
                : "bg-rose-100 text-rose-500"
            }`}
          >
            {toast.message}
          </div>
        )}

        {viewTab === "matrix" ? (
          <AiosellLiveMatrix
            hotelId={selectedHotelId}
            hotelName={selectedHotel?.name}
          />
        ) : (
          <>
            {/* Connection */}
            <form onSubmit={handleSaveConfig}>
              <SectionCard
                icon={Cable}
                title="Aiosell connection"
                description="Partner credentials used for every push, pull and webhook. Passwords are write-only and never returned."
              >
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      config?.isEnabled
                        ? "bg-primary-100 text-primary-600"
                        : "bg-amber-100 text-amber-500"
                    }`}
                  >
                    {config?.isEnabled ? (
                      <PlugZap size={13} strokeWidth={2.25} />
                    ) : (
                      <XCircle size={13} strokeWidth={2.25} />
                    )}
                    {config?.isEnabled ? "Connected" : "Disabled"}
                  </span>
                  <span className="text-brand-700/60 text-xs">
                    Last synced: {formatDate(config?.lastSyncAt)}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="PMS slug"
                    hint="Partner id used in the API path (e.g. sample-pms)."
                  >
                    <input
                      className={inputClass()}
                      value={pmsSlug}
                      onChange={(e) => setPmsSlug(e.target.value)}
                      placeholder="sample-pms"
                    />
                  </Field>
                  <Field label="Partner username">
                    <input
                      className={inputClass()}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="aiosell"
                    />
                  </Field>
                  <Field
                    label="Partner password"
                    hint="Leave blank to keep the current credential."
                  >
                    <input
                      type="password"
                      className={inputClass()}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </Field>
                  <Field label="API base URL">
                    <input
                      className={inputClass()}
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://live.aiosell.com/api/v2/cm"
                    />
                  </Field>
                </div>

                <div className="divide-surface-200 mt-2 divide-y">
                  <Toggle
                    checked={isEnabled}
                    onChange={setIsEnabled}
                    label="Enable channel manager"
                    description="Allow inventory and rate pushes to reach Aiosell."
                  />
                </div>

                <div className="mt-4">
                  <Button type="submit" icon={Save} disabled={configSaving}>
                    {configSaving ? "Saving..." : "Save connection"}
                  </Button>
                </div>
              </SectionCard>
            </form>

            {/* Per-hotel property + sync */}
            <SectionCard
              icon={Building2}
              title="Hotel sync from Aiosell"
              description="Pull the property mapping Aiosell holds for a hotel and rebuild its rooms, rate plans and approvals to match."
            >
              {hotelsLoading ? (
                <TableSkeleton rows={2} cols={3} />
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Field label="Hotel" hint={selectedHotel?.name}>
                    <select
                      className={inputClass()}
                      value={selectedHotelId}
                      onChange={(e) => handleSelectHotel(e.target.value)}
                    >
                      {hotels.map((h) => (
                        <option key={h._id} value={h._id}>
                          {h.name} ({h.hotelCode})
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Aiosell property code"
                    hint="The hotelCode used in Aiosell payloads for this property."
                  >
                    <div className="flex gap-2">
                      <input
                        className={inputClass()}
                        value={hotelAiosellCode}
                        onChange={(e) =>
                          setHotelAiosellCodeValue(e.target.value)
                        }
                        placeholder="sandbox-pms"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        icon={Pencil}
                        onClick={handleSaveAiosellCode}
                        disabled={codeSaving || !selectedHotelId}
                      >
                        {codeSaving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </Field>
                </div>
              )}

              {syncResult && (
                <div className="border-primary-200 bg-primary-100/40 mt-5 rounded-xl border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary-600" />
                    <span className="text-brand-900 text-sm font-semibold">
                      Sync complete
                    </span>
                    {syncResult.property && (
                      <span className="text-brand-700/60 text-xs">
                        — {syncResult.property.hotelName} (
                        {syncResult.property.hotelCode} ·{" "}
                        {syncResult.property.currency})
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-brand-700/60 text-[11px] font-semibold tracking-wide uppercase">
                        Rooms
                      </p>
                      <p className="text-brand-900 font-display text-lg font-bold">
                        {syncResult.rooms?.created ?? 0}
                      </p>
                      <p className="text-brand-700/60 text-xs">
                        {syncResult.rooms?.deleted ?? 0} replaced
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-brand-700/60 text-[11px] font-semibold tracking-wide uppercase">
                        Rate plans
                      </p>
                      <p className="text-brand-900 font-display text-lg font-bold">
                        {syncResult.ratePlans?.created ?? 0}
                      </p>
                      <p className="text-brand-700/60 text-xs">
                        {syncResult.ratePlans?.deleted ?? 0} replaced
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-brand-700/60 text-[11px] font-semibold tracking-wide uppercase">
                        Approvals
                      </p>
                      <p className="text-brand-900 font-display text-lg font-bold">
                        {syncResult.approvals?.created ?? 0}
                      </p>
                      <p className="text-brand-700/60 text-xs">
                        marked approved
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-brand-700/60 text-[11px] font-semibold tracking-wide uppercase">
                        Push to Aiosell
                      </p>
                      <p className="text-brand-900 font-display text-lg font-bold">
                        {syncResult.sync?.inventory?.ok &&
                        syncResult.sync?.rates?.ok ? (
                          <span className="text-primary-600">Synced</span>
                        ) : (
                          <span className="text-rose-500">
                            {syncResult.sync?.inventory?.ok ||
                            syncResult.sync?.rates?.ok
                              ? "Partial"
                              : "Failed"}
                          </span>
                        )}
                      </p>
                      <p className="text-brand-700/60 text-xs">
                        inventory
                        {syncResult.sync?.inventory?.ok ? " ✓" : " ✗"} · rates
                        {syncResult.sync?.rates?.ok ? " ✓" : " ✗"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5">
                <Button
                  icon={RefreshCw}
                  onClick={handleSync}
                  disabled={syncRunning || !selectedHotelId}
                >
                  {syncRunning
                    ? "Syncing from Aiosell..."
                    : "Sync from Aiosell"}
                </Button>
                <p className="text-brand-700/60 mt-2 text-xs">
                  Replaces the hotel's rooms, rate plans and approvals with the
                  Aiosell mapping, then pushes availability + rates back.
                </p>
              </div>
            </SectionCard>
          </>
        )}
      </main>
    </>
  );
}
