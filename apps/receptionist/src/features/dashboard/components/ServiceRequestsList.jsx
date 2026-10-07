import React, { useMemo } from "react";
import { Link } from "react-router";
import {
  Sparkles,
  Wrench,
  Shirt,
  UtensilsCrossed,
  PhoneCall,
  Bell,
  Pill,
  Car,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Eye,
  ArrowRight,
  DoorClosed,
  User,
} from "lucide-react";

/**
 * Returns an appropriate icon and accent color styling based on the request type.
 */
function getTypeMeta(rawType, typeLabel) {
  const t = (rawType || typeLabel || "").toUpperCase();

  if (t.includes("LAUNDRY")) {
    return {
      icon: Shirt,
      bg: "bg-indigo-50 text-indigo-600 border-indigo-100",
      pill: "bg-indigo-100 text-indigo-700",
      label: "Laundry",
    };
  }
  if (t.includes("MAINTENANCE")) {
    return {
      icon: Wrench,
      bg: "bg-amber-50 text-amber-600 border-amber-100",
      pill: "bg-amber-100 text-amber-700",
      label: "Maintenance",
    };
  }
  if (t.includes("HOUSEKEEPING")) {
    return {
      icon: Sparkles,
      bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      pill: "bg-emerald-100 text-emerald-700",
      label: "Housekeeping",
    };
  }
  if (t.includes("RESTAURANT") || t.includes("DINING")) {
    return {
      icon: UtensilsCrossed,
      bg: "bg-orange-50 text-orange-600 border-orange-100",
      pill: "bg-orange-100 text-orange-700",
      label: "Dining",
    };
  }
  if (t.includes("MEDICINE")) {
    return {
      icon: Pill,
      bg: "bg-rose-50 text-rose-600 border-rose-100",
      pill: "bg-rose-100 text-rose-700",
      label: "Medicine",
    };
  }
  if (t.includes("TRANSPORT")) {
    return {
      icon: Car,
      bg: "bg-cyan-50 text-cyan-600 border-cyan-100",
      pill: "bg-cyan-100 text-cyan-700",
      label: "Transport",
    };
  }
  if (t.includes("EMERGENCY")) {
    return {
      icon: AlertTriangle,
      bg: "bg-red-50 text-red-600 border-red-100",
      pill: "bg-red-100 text-red-700",
      label: "Emergency",
    };
  }
  if (t.includes("WAKEUP") || t.includes("WAKE-UP")) {
    return {
      icon: Clock,
      bg: "bg-sky-50 text-sky-600 border-sky-100",
      pill: "bg-sky-100 text-sky-700",
      label: "Wake-up",
    };
  }
  if (t.includes("RECEPTION") || t.includes("FRONT DESK")) {
    return {
      icon: PhoneCall,
      bg: "bg-violet-50 text-violet-600 border-violet-100",
      pill: "bg-violet-100 text-violet-700",
      label: "Front Desk",
    };
  }

  return {
    icon: Bell,
    bg: "bg-gray-50 text-gray-600 border-gray-100",
    pill: "bg-gray-100 text-gray-700",
    label: typeLabel || "Service",
  };
}

export default function ServiceRequestsList({
  serviceRequests = [],
  rooms = [],
  guests = [],
  acknowledgeRequest,
  completeRequest,
}) {
  // Pre-index rooms for fast O(1) lookup
  const roomMap = useMemo(() => {
    const map = new Map();
    rooms.forEach((r) => {
      if (r.id) map.set(r.id.toString(), r.roomNumber);
      if (r._id) map.set(r._id.toString(), r.roomNumber);
    });
    return map;
  }, [rooms]);

  // Index guests for room lookup fallback if request has guestId or guestName
  const guestRoomMap = useMemo(() => {
    const map = new Map();
    guests.forEach((g) => {
      const roomNum = g.room || (g.roomId && roomMap.get(g.roomId.toString()));
      if (roomNum) {
        if (g.id) map.set(g.id.toString(), roomNum);
        if (g._id) map.set(g._id.toString(), roomNum);
        if (g.name) map.set(g.name.trim().toLowerCase(), roomNum);
      }
    });
    return map;
  }, [guests, roomMap]);

  // Filter out completed requests for the active dashboard list
  const activeRequests = useMemo(() => {
    return serviceRequests.filter((r) => r.status !== "completed");
  }, [serviceRequests]);

  const urgentCount = useMemo(() => {
    return activeRequests.filter((r) => r.priority === "high").length;
  }, [activeRequests]);

  const resolveLocationAndGuest = (req) => {
    let roomNumber = null;

    if (req.room && !/^[a-f\d]{24}$/i.test(req.room)) {
      roomNumber = req.room;
    } else if (req.roomId && roomMap.has(req.roomId.toString())) {
      roomNumber = roomMap.get(req.roomId.toString());
    } else if (req.guestId && guestRoomMap.has(req.guestId.toString())) {
      roomNumber = guestRoomMap.get(req.guestId.toString());
    } else if (
      req.guestName &&
      guestRoomMap.has(req.guestName.trim().toLowerCase())
    ) {
      roomNumber = guestRoomMap.get(req.guestName.trim().toLowerCase());
    }

    const roomLabel = roomNumber ? `Room ${roomNumber}` : "Front Desk / Lobby";
    const guestLabel = req.guestName?.trim() || null;

    return {
      roomNumber,
      roomLabel,
      guestLabel,
    };
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="bg-primary-500 inline-block h-5 w-1.5 rounded-full" />
          <h2 className="text-brand-900 text-base font-bold tracking-tight">
            Service Requests
          </h2>
          {activeRequests.length > 0 && (
            <span className="bg-brand-50 text-brand-700 border-brand-100/60 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold">
              {activeRequests.length}
            </span>
          )}
          {urgentCount > 0 && (
            <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {urgentCount} URGENT
            </span>
          )}
        </div>

        <Link
          to="/housekeeping"
          className="group text-brand-600 hover:text-brand-800 inline-flex items-center gap-1 text-xs font-semibold transition-colors"
        >
          View All
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Requests List */}
      <div className="max-h-72 scrollbar-thin space-y-2.5 overflow-y-auto pr-0.5">
        {activeRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-8 text-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-gray-700">
              All caught up!
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              No pending service or housekeeping requests.
            </p>
          </div>
        ) : (
          activeRequests.map((req) => {
            const meta = getTypeMeta(req.rawType, req.type);
            const Icon = meta.icon;
            const { roomLabel, guestLabel } = resolveLocationAndGuest(req);
            const isUrgent = req.priority === "high";

            return (
              <div
                key={req.id}
                className={`group rounded-xl border p-3.5 transition-all hover:border-gray-200 hover:shadow-xs ${
                  isUrgent
                    ? "border-red-200 bg-red-50/20"
                    : "border-gray-100 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Category Icon */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta.bg}`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  {/* Main Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Room Badge */}
                        <span className="text-brand-900 inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold">
                          <DoorClosed className="h-3 w-3 text-gray-500" />
                          {roomLabel}
                        </span>

                        {/* Guest Badge (if available) */}
                        {guestLabel && (
                          <span className="bg-brand-50/70 border-brand-100/60 text-brand-800 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium">
                            <User className="text-brand-600 h-3 w-3" />
                            {guestLabel}
                          </span>
                        )}

                        {/* Request Type */}
                        <span className="text-xs font-semibold text-gray-800">
                          {req.type}
                        </span>
                      </div>

                      {/* Urgent Flag */}
                      {isUrgent && (
                        <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold tracking-wider text-red-700">
                          URGENT
                        </span>
                      )}
                    </div>

                    {/* Request Details */}
                    {req.detail && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600">
                        {req.detail}
                      </p>
                    )}

                    {/* Specific Items */}
                    {req.items && req.items.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {req.items.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center rounded-md border border-amber-200/50 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bottom Status & Action Bar */}
                    <div className="mt-3 flex items-center justify-between border-t border-gray-100/80 pt-2.5">
                      <div className="flex items-center gap-2">
                        {/* Status Chip */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            req.status === "requested"
                              ? "bg-amber-100 text-amber-700"
                              : req.status === "acknowledged"
                                ? "bg-blue-100 text-blue-700"
                                : req.status === "in-progress"
                                  ? "bg-primary-100 text-primary-700"
                                  : "bg-green-100 text-green-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              req.status === "requested"
                                ? "bg-amber-500"
                                : req.status === "acknowledged"
                                  ? "bg-blue-500"
                                  : req.status === "in-progress"
                                    ? "bg-primary-500"
                                    : "bg-green-500"
                            }`}
                          />
                          {req.status === "requested"
                            ? "New Request"
                            : req.status === "acknowledged"
                              ? "Acknowledged"
                              : req.status === "in-progress"
                                ? "In Progress"
                                : "Completed"}
                        </span>

                        {/* Relative / Formatted Time */}
                        <span className="text-[10px] text-gray-400">
                          {req.time}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {req.status === "requested" && (
                          <button
                            onClick={() => acknowledgeRequest(req.id)}
                            className="bg-brand-900 hover:bg-brand-800 inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs transition-all active:scale-95"
                          >
                            <Eye className="h-3 w-3" />
                            Acknowledge
                          </button>
                        )}
                        {(req.status === "acknowledged" ||
                          req.status === "in-progress") && (
                          <button
                            onClick={() => completeRequest(req.id)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
