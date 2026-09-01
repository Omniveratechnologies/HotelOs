import React from "react";

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DashboardHeader({ firstName, hotelName }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-display text-navy-900 text-2xl font-bold">
          Good Morning, {firstName} 👋
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {formatToday()} · {hotelName}
        </p>
      </div>
      <div className="flex gap-2">
        <button className="bg-navy-900 hover:bg-navy-800 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors">
          + New Booking
        </button>
        <button className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
          Export Report
        </button>
      </div>
    </div>
  );
}
