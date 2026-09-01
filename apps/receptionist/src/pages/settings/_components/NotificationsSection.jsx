import { useEffect, useState } from "react";

/**
 * TODO: Implement backend integration for notification preferences. For now, they are stored in localStorage.
 */

export default function NotificationsSection() {
  const [notifs, setNotifs] = useState({
    newBooking: false,
    checkIn: false,
    checkOut: false,
    foodOrder: false,
    serviceRequest: false,
    lowOccupancy: false,
  });

  useEffect(() => {
    // mock loading from localStorage for now. In the future, these will be loaded from the backend.
    const storedNotifs = localStorage.getItem("notificationPreferences");
    if (storedNotifs) {
      try {
        console.log("storeNotifs", storedNotifs);
        // oxlint-disable-next-line react/set-state-in-effect -- can be optimized later, but for now we want to load the stored preferences on mount
        setNotifs(JSON.parse(storedNotifs));
      } catch (err) {
        console.error("Failed to parse notification preferences:", err);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("notificationPreferences", JSON.stringify(notifs));
    console.log("notifs", notifs);
  }, [notifs]);

  return (
    <div className="space-y-3">
      {Object.entries(notifs).map(([k, v]) => (
        <div
          key={k}
          className="flex items-center justify-between border-b border-gray-50 py-2 last:border-0"
        >
          <div>
            <div className="text-navy-900 text-sm font-medium capitalize">
              {k.replace(/([A-Z])/g, " $1").trim()}
            </div>
            <div className="text-xs text-gray-400">
              Receive alerts for this event
            </div>
          </div>
          <button
            onClick={() => setNotifs((p) => ({ ...p, [k]: !v }))}
            className={`relative h-6 w-12 rounded-full transition-all duration-200 ${v ? "bg-navy-900" : "bg-gray-200"}`}
          >
            <div
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${v ? "left-6" : "left-0.5"}`}
            />
          </button>
        </div>
      ))}
      <p className="text-[10px] text-gray-400">
        Notification preferences are stored locally for now.
      </p>
    </div>
  );
}
