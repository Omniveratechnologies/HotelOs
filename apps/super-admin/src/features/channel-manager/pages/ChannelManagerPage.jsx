import { useState } from "react";
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
import Topbar from "../../../components/layout/Topbar.jsx";
import Field from "../../../components/ui/Field.jsx";
import { inputClass } from "../../../components/ui/inputClass.js";
import Button from "../../../components/ui/Button.jsx";
import { TableSkeleton } from "../../../components/ui/States.jsx";
import {
  useHotels,
  useSetHotelAiosellCode,
  useSyncHotelFromAiosell,
} from "../../hotels/hooks/useHotels.js";
import {
  useChannelManagerConfig,
  useUpdateChannelManagerConfig,
} from "../hooks/useChannelManager.js";
import AiosellLiveMatrix from "../components/AiosellLiveMatrix.jsx";

/**
 * Reusable section card with icon header.
 * @param {object} props
 * @param {import('lucide-react').LucideIcon} props.icon
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {import('react').ReactNode} props.children
 * @returns {JSX.Element}
 */
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

/**
 * Toggle switch component.
 * @param {object} props
 * @param {boolean} props.checked
 * @param {(checked: boolean) => void} props.onChange
 * @param {string} props.label
 * @param {string} [props.description]
 * @returns {JSX.Element}
 */
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

/**
 * Formats a date value for localized display.
 * @param {string|number|Date} value
 * @returns {string}
 */
const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

/**
 * Connection settings configuration card for Aiosell integration.
 * @param {object} props
 * @param {object} props.config
 * @param {(data: object) => void} props.onSave
 * @param {boolean} props.saving
 * @returns {JSX.Element}
 */
function ConnectionSettingsCard({ config, onSave, saving }) {
  const [pmsSlug, setPmsSlug] = useState(config?.pmsSlug || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || "");
  const [isEnabled, setIsEnabled] = useState(Boolean(config?.isEnabled));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ pmsSlug, username, password, baseUrl, isEnabled });
  };

  return (
    <form onSubmit={handleSubmit}>
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
          <Button type="submit" icon={Save} disabled={saving}>
            {saving ? "Saving..." : "Save connection"}
          </Button>
        </div>
      </SectionCard>
    </form>
  );
}

/**
 * Hotel synchronization card for pulling mapping from Aiosell.
 * @param {object} props
 * @param {Array<object>} props.hotels
 * @param {boolean} props.hotelsLoading
 * @param {string} props.selectedHotelId
 * @param {(id: string) => void} props.onSelectHotel
 * @param {(code: string) => void} props.onSaveCode
 * @param {boolean} props.codeSaving
 * @param {() => void} props.onSync
 * @param {boolean} props.syncRunning
 * @param {object|null} props.syncResult
 * @returns {JSX.Element}
 */
function HotelSyncCard({
  hotels,
  hotelsLoading,
  selectedHotelId,
  onSelectHotel,
  onSaveCode,
  codeSaving,
  onSync,
  syncRunning,
  syncResult,
}) {
  const selectedHotel = hotels.find(
    (h) => String(h._id) === String(selectedHotelId),
  );
  const [hotelAiosellCode, setHotelAiosellCode] = useState(
    selectedHotel?.aiosellHotelCode || "",
  );

  return (
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
              onChange={(e) => onSelectHotel(e.target.value)}
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
                onChange={(e) => setHotelAiosellCode(e.target.value)}
                placeholder="sandbox-pms"
              />
              <Button
                type="button"
                variant="secondary"
                icon={Pencil}
                onClick={() => onSaveCode(hotelAiosellCode)}
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
                {syncResult.property.hotelCode} · {syncResult.property.currency}
                )
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
              <p className="text-brand-700/60 text-xs">marked approved</p>
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
          onClick={onSync}
          disabled={syncRunning || !selectedHotelId}
        >
          {syncRunning ? "Syncing from Aiosell..." : "Sync from Aiosell"}
        </Button>
        <p className="text-brand-700/60 mt-2 text-xs">
          Replaces the hotel's rooms, rate plans and approvals with the Aiosell
          mapping, then pushes availability + rates back.
        </p>
      </div>
    </SectionCard>
  );
}

/**
 * Super-admin Channel Manager management page component.
 * Allows managing partner credentials, triggering hotel sync, and viewing live rate matrices.
 * @returns {JSX.Element}
 */
export default function ChannelManagerPage() {
  const { onMenuClick } = useOutletContext();

  const { hotels, isLoading: hotelsLoading } = useHotels();
  const { config, refetch: refetchConfig } = useChannelManagerConfig();
  const updateConfigMut = useUpdateChannelManagerConfig();
  const setHotelAiosellCodeMut = useSetHotelAiosellCode();
  const syncHotelFromAiosellMut = useSyncHotelFromAiosell();

  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [viewTab, setViewTab] = useState("matrix"); // "matrix" | "settings"

  const [configSaving, setConfigSaving] = useState(false);
  const [codeSaving, setCodeSaving] = useState(false);
  const [syncRunning, setSyncRunning] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const [toast, setToast] = useState(null);

  const effectiveHotelId = selectedHotelId || hotels[0]?._id || "";

  const showToast = (ok, message) => {
    setToast({ ok, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveConfig = async ({
    isEnabled,
    pmsSlug,
    username,
    password,
    baseUrl,
  }) => {
    setConfigSaving(true);
    setToast(null);
    try {
      const payload = { isEnabled };
      if (pmsSlug?.trim()) payload.pmsSlug = pmsSlug.trim();
      if (username?.trim()) payload.username = username.trim();
      if (password?.trim()) payload.password = password;
      if (baseUrl?.trim()) payload.baseUrl = baseUrl.trim();
      const result = await updateConfigMut.mutateAsync(payload);
      showToast(true, result?.message || "Channel manager config saved");
      await refetchConfig();
    } catch (err) {
      console.error("Failed to save config:", err);
      showToast(false, err.message || "Failed to save config");
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSelectHotel = (hotelId) => {
    setSelectedHotelId(hotelId);
    setSyncResult(null);
  };

  const handleSaveAiosellCode = async (code) => {
    if (!effectiveHotelId) return;
    setCodeSaving(true);
    setToast(null);
    try {
      await setHotelAiosellCodeMut.mutateAsync({
        hotelId: effectiveHotelId,
        aiosellHotelCode: code.trim(),
      });
      showToast(true, "Aiosell property code updated");
    } catch (err) {
      console.error("Failed to update Aiosell code:", err);
      showToast(false, err.message || "Failed to update Aiosell code");
    } finally {
      setCodeSaving(false);
    }
  };

  const handleSync = async () => {
    if (!effectiveHotelId) return;
    const confirmed = window.confirm(
      "This replaces the selected hotel's rooms, rate plans and approvals with the mapping pulled from Aiosell, then pushes availability + rates back. Continue?",
    );
    if (!confirmed) return;

    setSyncRunning(true);
    setSyncResult(null);
    setToast(null);
    try {
      const result =
        await syncHotelFromAiosellMut.mutateAsync(effectiveHotelId);
      setSyncResult(result?.data);
      showToast(true, result?.message || "Synced from Aiosell");
      await refetchConfig();
    } catch (err) {
      console.error("Sync from Aiosell failed:", err);
      showToast(false, err.message || "Sync from Aiosell failed");
    } finally {
      setSyncRunning(false);
    }
  };

  const selectedHotel = hotels.find(
    (h) => String(h._id) === String(effectiveHotelId),
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
              value={effectiveHotelId}
              onChange={(e) => handleSelectHotel(e.target.value)}
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
            hotelId={effectiveHotelId}
            hotelName={selectedHotel?.name}
          />
        ) : (
          <>
            <ConnectionSettingsCard
              key={
                config?.lastSyncAt || config?.baseUrl || "default-connection"
              }
              config={config}
              saving={configSaving}
              onSave={handleSaveConfig}
            />

            <HotelSyncCard
              key={effectiveHotelId}
              hotels={hotels}
              hotelsLoading={hotelsLoading}
              selectedHotelId={effectiveHotelId}
              onSelectHotel={handleSelectHotel}
              onSaveCode={handleSaveAiosellCode}
              codeSaving={codeSaving}
              onSync={handleSync}
              syncRunning={syncRunning}
              syncResult={syncResult}
            />
          </>
        )}
      </main>
    </>
  );
}
