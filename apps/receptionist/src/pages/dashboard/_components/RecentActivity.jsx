import React from "react";

function formatRelativeTime(date) {
  if (!date) return "";
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hr ago" : `${hours} hrs ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

export default function RecentActivity({ recentActivity, statsError }) {
  return (
    <div className="bg-navy-900 rounded-2xl p-5">
      <h2 className="mb-3 flex items-center gap-2 font-bold text-white">
        <span className="bg-gold-400 inline-block h-5 w-1 rounded-full" />
        Recent Activity
      </h2>
      <div className="space-y-2">
        {statsError ? (
          <div className="text-xs text-white/40">{statsError}</div>
        ) : recentActivity.length === 0 ? (
          <div className="text-xs text-white/40">No recent activity yet.</div>
        ) : (
          recentActivity.map((a) => (
            <div key={a._id || a.createdAt} className="flex items-start gap-2">
              <div className="bg-gold-400 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs text-white/80">{a.text}</div>
                <div className="text-[10px] text-white/30">
                  {formatRelativeTime(a.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
