import React, { useState } from "react";
import { useHotelOS } from "../../app/providers.jsx";

export default function HousekeepingPage() {
  const {
    serviceRequests,
    setServiceRequests,
    rooms,
    acknowledgeRequest,
    completeRequest,
  } = useHotelOS();
  const [filter, setFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [newReq, setNewReq] = useState({
    room: "",
    type: "Housekeeping request",
    detail: "",
    priority: "normal",
  });

  const filtered =
    filter === "all"
      ? serviceRequests
      : serviceRequests.filter((r) => r.status === filter);

  const statusBadge = {
    requested: "bg-orange-100 text-orange-700",
    acknowledged: "bg-blue-100 text-blue-700",
    "in-progress": "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
  };

  const typeIcon = {
    "Housekeeping request": "🧹",
    "Amenity request": "🛁",
    Maintenance: "🔧",
    "Call restaurant": "📞",
    Laundry: "👕",
    Other: "📝",
  };

  const addRequest = () => {
    if (!newReq.room || !newReq.detail) return;
    setServiceRequests((prev) => [
      {
        id: Date.now(),
        ...newReq,
        status: "requested",
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      ...prev,
    ]);
    setShowNew(false);
    setNewReq({
      room: "",
      type: "Housekeeping request",
      detail: "",
      priority: "normal",
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0f1f3d]">
            Housekeeping & Requests
          </h1>
          <p className="text-sm text-gray-500">
            {serviceRequests.filter((r) => r.status === "requested").length}{" "}
            pending ·{" "}
            {serviceRequests.filter((r) => r.status === "completed").length}{" "}
            completed today
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="rounded-xl bg-[#0f1f3d] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#162847]"
        >
          + New Request
        </button>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        {[
          [
            "Pending",
            "requested",
            "bg-orange-50 border-orange-200 text-orange-600",
            "🔔",
          ],
          [
            "Acknowledged",
            "acknowledged",
            "bg-blue-50 border-blue-200 text-blue-600",
            "👁",
          ],
          [
            "In Progress",
            "in-progress",
            "bg-purple-50 border-purple-200 text-purple-600",
            "⚡",
          ],
          [
            "Completed",
            "completed",
            "bg-green-50 border-green-200 text-green-600",
            "✅",
          ],
        ].map(([label, key, cls, icon]) => (
          <div
            key={label}
            className={`rounded-2xl border p-4 ${cls.split(" ")[0]} ${cls.split(" ")[1]}`}
          >
            <div className="mb-1 text-2xl">{icon}</div>
            <div className={`text-2xl font-bold ${cls.split(" ")[2]}`}>
              {serviceRequests.filter((r) => r.status === key).length}
            </div>
            <div className="mt-0.5 text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Needs Cleaning Rooms */}
      {rooms.filter((r) => r.status === "cleaning").length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">🧹</span>
            <h3 className="font-bold text-amber-700">Rooms Needing Cleaning</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {rooms
              .filter((r) => r.status === "cleaning")
              .map((r) => (
                <span
                  key={r.id}
                  className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700"
                >
                  Room {r.id}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 flex w-fit gap-1 rounded-xl bg-gray-100 p-1">
        {["all", "requested", "acknowledged", "in-progress", "completed"].map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${filter === s ? "bg-white text-[#0f1f3d] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {s.replace("-", " ")}
            </button>
          ),
        )}
      </div>

      {/* Requests */}
      <div className="space-y-3">
        {filtered.map((req) => (
          <div
            key={req.id}
            className={`rounded-2xl border bg-white p-4 shadow-sm ${req.priority === "high" ? "border-red-200" : "border-gray-100"}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl">
                {typeIcon[req.type] || "📝"}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0f1f3d]">
                        Room {req.room}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm font-semibold text-[#0f1f3d]">
                        {req.type}
                      </span>
                      {req.priority === "high" && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                          URGENT
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{req.detail}</p>
                    <div className="mt-1 text-xs text-gray-400">{req.time}</div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusBadge[req.status]}`}
                    >
                      {req.status.replace("-", " ").toUpperCase()}
                    </span>
                    {req.status === "requested" && (
                      <button
                        onClick={() => acknowledgeRequest(req.id)}
                        className="rounded-lg bg-[#0f1f3d] px-3 py-1.5 text-xs text-white transition-colors hover:bg-[#162847]"
                      >
                        Acknowledge
                      </button>
                    )}
                    {req.status === "acknowledged" && (
                      <button
                        onClick={() => completeRequest(req.id)}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-green-700"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            No requests found
          </div>
        )}
      </div>

      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowNew(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-[#0f1f3d]">
              New Service Request
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Room
                </label>
                <select
                  value={newReq.room}
                  onChange={(e) =>
                    setNewReq((p) => ({ ...p, room: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#c9a84c] focus:outline-none"
                >
                  <option value="">Select Room</option>
                  {rooms
                    .filter((r) => r.status === "occupied")
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.id} – {r.guest}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Type
                </label>
                <select
                  value={newReq.type}
                  onChange={(e) =>
                    setNewReq((p) => ({ ...p, type: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#c9a84c] focus:outline-none"
                >
                  {Object.keys(typeIcon).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Details
                </label>
                <textarea
                  value={newReq.detail}
                  onChange={(e) =>
                    setNewReq((p) => ({ ...p, detail: e.target.value }))
                  }
                  rows={3}
                  className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#c9a84c] focus:outline-none"
                  placeholder="Describe the request..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Priority
                </label>
                <div className="mt-1 flex gap-2">
                  {["normal", "high"].map((p) => (
                    <button
                      key={p}
                      onClick={() =>
                        setNewReq((prev) => ({ ...prev, priority: p }))
                      }
                      className={`flex-1 rounded-xl border-2 py-2 text-sm font-semibold transition-all ${newReq.priority === p ? (p === "high" ? "border-red-500 bg-red-50 text-red-600" : "border-[#0f1f3d] bg-[#0f1f3d]/5 text-[#0f1f3d]") : "border-gray-200 text-gray-500"}`}
                    >
                      {p === "high" ? "🚨 Urgent" : "📋 Normal"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowNew(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addRequest}
                className="flex-1 rounded-xl bg-[#0f1f3d] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#162847]"
              >
                Create Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
