import React from "react";

export default function ServiceRequestsList({
  serviceRequests,
  acknowledgeRequest,
  completeRequest,
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
      <h2 className="text-navy-900 mb-3 flex items-center gap-2 font-bold">
        <span className="bg-gold-400 inline-block h-5 w-1 rounded-full" />
        Service Requests
      </h2>
      <div className="max-h-52 scrollbar-thin space-y-3 overflow-y-auto">
        {serviceRequests
          .filter((r) => r.status !== "completed")
          .map((req) => (
            <div key={req.id} className="rounded-xl border border-gray-100 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-navy-900 text-xs font-semibold">
                    Room {req.room} · {req.type}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-gray-500">
                    {req.detail}
                  </div>
                </div>
                {req.priority === "high" && (
                  <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-600">
                    URGENT
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${req.status === "requested" ? "bg-orange-100 text-orange-600" : req.status === "acknowledged" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}
                >
                  ● {req.status.toUpperCase()}
                </span>
                {req.status === "requested" && (
                  <button
                    onClick={() => acknowledgeRequest(req.id)}
                    className="bg-navy-900 hover:bg-navy-800 rounded-full px-2 py-0.5 text-[9px] text-white transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
                {req.status === "acknowledged" && (
                  <button
                    onClick={() => completeRequest(req.id)}
                    className="rounded-full bg-green-600 px-2 py-0.5 text-[9px] text-white transition-colors hover:bg-green-700"
                  >
                    Complete
                  </button>
                )}
                <span className="ml-auto text-[9px] text-gray-400">
                  {req.time}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
