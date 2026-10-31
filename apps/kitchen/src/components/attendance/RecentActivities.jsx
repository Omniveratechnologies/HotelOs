import Avatar from "../ui/Avatar";
import { formatDate, formatTime } from "../../utils/attendanceFormat.js";

const ACTIONS = {
  CHECKED_IN: "checked in",
  CHECKED_IN_LATE: "checked in (Late)",
  CHECKED_OUT: "checked out",
  MARKED_ABSENT: "marked absent",
  ON_LEAVE: "is on leave",
  HOLIDAY: "is on holiday",
};

const RecentActivities = ({
  activities = [],
  loading = false,
  error = "",
  onViewAll,
}) => (
  <section
    aria-label="Recent attendance activities"
    className="rounded-xl border border-gray-800 bg-[#111111] p-4"
  >
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-white">
        Recent Attendance Activities
      </h2>
      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
        >
          View All &rarr;
        </button>
      )}
    </div>

    {error ? (
      <p role="alert" className="py-6 text-center text-xs text-red-400">
        {error}
      </p>
    ) : loading && activities.length === 0 ? (
      <p className="py-6 text-center text-xs text-gray-500">Loading...</p>
    ) : activities.length === 0 ? (
      <p className="py-6 text-center text-xs text-gray-500">No activity yet.</p>
    ) : (
      <ul className="space-y-4">
        {activities.map((activity) => (
          <li
            key={`${activity._id}-${activity.at}`}
            className="flex items-start gap-3"
          >
            <Avatar
              src={activity.staff.photoUrl}
              name={activity.staff.name}
              size={32}
            />

            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-200">
                <span className="font-medium">{activity.staff.name}</span>{" "}
                {ACTIONS[activity.action] || activity.action}
              </p>
              <p className="truncate text-[11px] text-gray-500">
                {[activity.department?.name, activity.designation?.name]
                  .filter(Boolean)
                  .join(" · ") || "-"}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-xs text-gray-300">{formatTime(activity.at)}</p>
              <p className="text-[10px] text-gray-500">
                {formatDate(activity.date)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default RecentActivities;
