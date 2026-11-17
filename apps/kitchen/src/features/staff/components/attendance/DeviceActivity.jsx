import { timeAgo } from "../../utils/deviceFormat.js";

const DOT = {
  ONLINE: "bg-emerald-400",
  SYNC_OK: "bg-emerald-400",
  OFFLINE: "bg-red-400",
  ALERT: "bg-red-400",
  SYNC_FAILED: "bg-red-400",
  WARNING: "bg-yellow-400",
  COMMAND: "bg-blue-400",
  CREATED: "bg-blue-400",
  UPDATED: "bg-gray-400",
  REMOVED: "bg-gray-500",
};

const DeviceActivity = ({ activity = [], loading = false, error = "" }) => (
  <section
    aria-label="Recent device activity"
    className="rounded-xl border border-gray-800 bg-[#111111] p-4"
  >
    <h2 className="mb-3 text-sm font-semibold text-white">
      Recent Device Activity
    </h2>

    {error ? (
      <p role="alert" className="py-6 text-center text-xs text-red-400">
        {error}
      </p>
    ) : loading && activity.length === 0 ? (
      <p className="py-6 text-center text-xs text-gray-500">Loading...</p>
    ) : activity.length === 0 ? (
      <p className="py-6 text-center text-xs text-gray-500">No activity yet.</p>
    ) : (
      <ul className="space-y-3.5">
        {activity.map((item) => (
          <li key={item._id} className="flex items-start gap-3">
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[item.type] || "bg-gray-500"}`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-gray-200">
                {item.device?.name || "Removed device"}
              </p>
              <p className="truncate text-[11px] text-gray-500">
                {item.message}
              </p>
            </div>
            <span className="shrink-0 text-[10px] text-gray-500">
              {timeAgo(item.at)}
            </span>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default DeviceActivity;
