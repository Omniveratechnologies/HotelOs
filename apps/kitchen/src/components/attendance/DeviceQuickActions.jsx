import { FiPlus, FiRefreshCw, FiSettings, FiZap } from "react-icons/fi";

const Action = ({ icon, label, hint, onClick, busy }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className="flex w-full items-center gap-3 rounded-lg border border-gray-800 px-3 py-2.5 text-left transition hover:bg-gray-800/60 disabled:opacity-60"
  >
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block text-xs font-medium text-gray-200">{label}</span>
      <span className="block truncate text-[10px] text-gray-500">{hint}</span>
    </span>
  </button>
);

const DeviceQuickActions = ({
  onAdd,
  onTest,
  onSyncAll,
  onSettings,
  syncing = false,
}) => (
  <section
    aria-label="Quick actions"
    className="flex h-full flex-col rounded-xl border border-gray-800 bg-[#111111] p-4"
  >
    <h2 className="mb-3 text-sm font-semibold text-white">Quick Actions</h2>
    <div className="grid flex-1 content-start gap-2 sm:grid-cols-2">
      <Action
        icon={<FiPlus size={15} />}
        label="Add Device"
        hint="Register a new kiosk"
        onClick={onAdd}
      />
      <Action
        icon={<FiZap size={15} />}
        label="Test Connection"
        hint="Check one device now"
        onClick={onTest}
      />
      <Action
        icon={
          <FiRefreshCw size={15} className={syncing ? "animate-spin" : ""} />
        }
        label="Sync All Devices"
        hint="Ask every live device to sync"
        onClick={onSyncAll}
        busy={syncing}
      />
      <Action
        icon={<FiSettings size={15} />}
        label="Device Settings"
        hint="Edit name, IP and config"
        onClick={onSettings}
      />
    </div>
  </section>
);

export default DeviceQuickActions;
