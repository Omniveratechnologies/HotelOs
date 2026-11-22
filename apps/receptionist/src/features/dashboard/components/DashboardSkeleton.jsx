import React from "react";

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* StatCards shimmer row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, idx) => (
          <div
            key={`skel-card-${idx}`}
            className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4 shadow-xs"
          >
            <div className="mb-3 h-9 w-9 rounded-xl bg-gray-100" />
            <div className="mb-1.5 h-7 w-16 rounded bg-gray-200" />
            <div className="h-3 w-24 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Main Grid shimmer (RoomGrid + Sidebar) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* RoomGrid skeleton (2 columns wide on xl) */}
        <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-xs xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="h-7 w-36 rounded-lg bg-gray-200" />
            <div className="h-8 w-48 rounded-lg bg-gray-100" />
          </div>
          <div className="mb-5 h-10 w-full rounded-xl bg-gray-100" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 12 }, (_, idx) => (
              <div
                key={`skel-room-${idx}`}
                className="h-24 rounded-xl border border-gray-100 bg-gray-50/70 p-3"
              >
                <div className="mb-2 h-4 w-12 rounded bg-gray-200" />
                <div className="h-3 w-20 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar skeleton widgets */}
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, cardIdx) => (
            <div
              key={`skel-sidebar-${cardIdx}`}
              className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4 shadow-xs"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="h-5 w-32 rounded bg-gray-200" />
                <div className="h-4 w-12 rounded bg-gray-100" />
              </div>
              <div className="space-y-2">
                <div className="h-10 w-full rounded-lg bg-gray-50" />
                <div className="h-10 w-full rounded-lg bg-gray-50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
