import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Edit3,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  TrendingUp,
} from "lucide-react";
import {
  getLiveRates,
  updateLiveRates,
  getLiveInventory,
  updateLiveInventory,
  updateRateRestrictions,
  updateInventoryRestrictions,
  markChannelNoShow,
} from "../../services/hotel.service.js";

function formatDateHeader(dateStr) {
  if (!dateStr) return { day: "", weekday: "" };
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const weekday = d.toLocaleDateString("en-IN", {
    weekday: "short",
    timeZone: "UTC",
  });
  return { day, weekday };
}

function addDays(dateStr, count) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + count);
  return d.toISOString().slice(0, 10);
}

export default function AiosellLiveMatrix({ hotelId, hotelName }) {
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [activeTab, setActiveTab] = useState("rates"); // "rates" | "inventory" | "restrictions"

  const [ratesData, setRatesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // Modals state
  const [cellEditModal, setCellEditModal] = useState(null);
  const [bulkRateModalOpen, setBulkRateModalOpen] = useState(false);
  const [bulkInvModalOpen, setBulkInvModalOpen] = useState(false);

  // Form states for modals
  const [editValue, setEditValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Bulk rate state
  const [bulkStart, setBulkStart] = useState(startDate);
  const [bulkEnd, setBulkEnd] = useState(() => addDays(startDate, 9));
  const [bulkRoomCode, setBulkRoomCode] = useState("all");
  const [bulkPlanCode, setBulkPlanCode] = useState("all");
  const [bulkRateVal, setBulkRateVal] = useState("");

  // Bulk inv state
  const [bulkInvStart, setBulkInvStart] = useState(startDate);
  const [bulkInvEnd, setBulkInvEnd] = useState(() => addDays(startDate, 9));
  const [bulkInvRoomCode, setBulkInvRoomCode] = useState("");
  const [bulkInvCount, setBulkInvCount] = useState("");

  // Restrictions state
  const [restStart, setRestStart] = useState(startDate);
  const [restEnd, setRestEnd] = useState(() => addDays(startDate, 9));
  const [restScope, setRestScope] = useState("rate"); // "rate" | "inventory" | "both"
  const [restRoomCode, setRestRoomCode] = useState("");
  const [restPlanCode, setRestPlanCode] = useState("");
  const [minStay, setMinStay] = useState("");
  const [maxStay, setMaxStay] = useState("");
  const [stopSell, setStopSell] = useState(false);
  const [cta, setCta] = useState(false);
  const [ctd, setCtd] = useState(false);

  // No-show state
  const [noShowBookingId, setNoShowBookingId] = useState("");

  const endDate = addDays(startDate, 9);

  const loadData = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    setError("");
    try {
      const [rRes, iRes] = await Promise.all([
        getLiveRates({ hotelId, startDate, endDate }),
        getLiveInventory({ hotelId, startDate, endDate }),
      ]);
      setRatesData(rRes);
      setInventoryData(iRes);
    } catch (err) {
      console.error("Fetch live data error:", err);
      setError(err.message || "Failed to load live data from Aiosell");
    } finally {
      setLoading(false);
    }
  }, [hotelId, startDate, endDate]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [rRes, iRes] = await Promise.all([
          getLiveRates({ hotelId, startDate, endDate }),
          getLiveInventory({ hotelId, startDate, endDate }),
        ]);
        if (!ignore) {
          setRatesData(rRes);
          setInventoryData(iRes);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Fetch live data error:", err);
          setError(err.message || "Failed to load live data from Aiosell");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    if (hotelId) {
      init();
    }
    return () => {
      ignore = true;
    };
  }, [hotelId, startDate, endDate]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const handlePrev10 = () => {
    setStartDate((prev) => addDays(prev, -10));
  };

  const handleNext10 = () => {
    setStartDate((prev) => addDays(prev, 10));
  };

  const handleToday = () => {
    setStartDate(new Date().toISOString().slice(0, 10));
  };

  // Quick cell edit handler
  const handleSaveCell = async (e) => {
    e.preventDefault();
    if (!cellEditModal) return;
    setSubmitting(true);
    try {
      if (cellEditModal.type === "rate") {
        const val = Number(editValue);
        if (isNaN(val) || val <= 0)
          throw new Error("Please enter a valid rate");
        await updateLiveRates({
          hotelId,
          updates: [
            {
              startDate: cellEditModal.date,
              endDate: cellEditModal.date,
              rates: [
                {
                  roomCode: cellEditModal.roomCode,
                  rateplanCode: cellEditModal.planCode,
                  rate: val,
                },
              ],
            },
          ],
        });
        showToast(`Rate updated to ₹${val} for ${cellEditModal.date}`);
      } else {
        const val = Number(editValue);
        if (isNaN(val) || val < 0)
          throw new Error("Please enter a valid count");
        await updateLiveInventory({
          hotelId,
          updates: [
            {
              startDate: cellEditModal.date,
              endDate: cellEditModal.date,
              rooms: [{ roomCode: cellEditModal.roomCode, available: val }],
            },
          ],
        });
        showToast(
          `Available inventory updated to ${val} for ${cellEditModal.date}`,
        );
      }
      setCellEditModal(null);
      await loadData();
    } catch (err) {
      alert(err.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk rate submit
  const handleBulkRateSubmit = async (e) => {
    e.preventDefault();
    const val = Number(bulkRateVal);
    if (isNaN(val) || val <= 0) {
      alert("Please enter a valid rate");
      return;
    }
    setSubmitting(true);
    try {
      const currentRoomTypes = ratesData?.roomTypes || [];
      const targetRates = [];

      for (const rt of currentRoomTypes) {
        if (bulkRoomCode !== "all" && rt.roomCode !== bulkRoomCode) continue;
        for (const rp of rt.ratePlans || []) {
          if (bulkPlanCode !== "all" && rp.ratePlanCode !== bulkPlanCode)
            continue;
          targetRates.push({
            roomCode: rt.roomCode,
            rateplanCode: rp.ratePlanCode,
            rate: val,
          });
        }
      }

      if (targetRates.length === 0) {
        throw new Error("No matching rate plans selected");
      }

      await updateLiveRates({
        hotelId,
        updates: [
          { startDate: bulkStart, endDate: bulkEnd, rates: targetRates },
        ],
      });

      showToast(`Bulk rate ₹${val} pushed for ${bulkStart} to ${bulkEnd}`);
      setBulkRateModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.message || "Bulk update failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk inventory submit
  const handleBulkInvSubmit = async (e) => {
    e.preventDefault();
    const val = Number(bulkInvCount);
    if (isNaN(val) || val < 0) {
      alert("Please enter a valid count");
      return;
    }
    setSubmitting(true);
    try {
      await updateLiveInventory({
        hotelId,
        updates: [
          {
            startDate: bulkInvStart,
            endDate: bulkInvEnd,
            rooms: [{ roomCode: bulkInvRoomCode, available: val }],
          },
        ],
      });
      showToast(`Inventory ${val} pushed for ${bulkInvStart} to ${bulkInvEnd}`);
      setBulkInvModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.message || "Inventory push failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Restrictions submit
  const handleRestrictionsSubmit = async (e) => {
    e.preventDefault();
    if (!restRoomCode) {
      alert("Please select a room type");
      return;
    }
    setSubmitting(true);
    try {
      const calls = [];

      if (restScope === "rate" || restScope === "both") {
        const ratePayload = {
          roomCode: restRoomCode,
          ...(restPlanCode ? { rateplanCode: restPlanCode } : {}),
          ...(minStay ? { min_stay: Number(minStay) } : {}),
          ...(maxStay ? { max_stay: Number(maxStay) } : {}),
          closed_to_arrival: cta,
          closed_to_departure: ctd,
          stop_sell: stopSell,
        };

        calls.push(
          updateRateRestrictions({
            hotelId,
            updates: [
              { startDate: restStart, endDate: restEnd, rates: [ratePayload] },
            ],
          }),
        );
      }

      if (restScope === "inventory" || restScope === "both") {
        const invPayload = {
          roomCode: restRoomCode,
          closed_to_arrival: cta,
          closed_to_departure: ctd,
          stop_sell: stopSell,
        };

        calls.push(
          updateInventoryRestrictions({
            hotelId,
            updates: [
              { startDate: restStart, endDate: restEnd, rooms: [invPayload] },
            ],
          }),
        );
      }

      await Promise.all(calls);
      showToast(
        `Restrictions pushed to Aiosell for ${restStart} to ${restEnd}`,
      );
      await loadData();
    } catch (err) {
      alert(err.message || "Restrictions update failed");
    } finally {
      setSubmitting(false);
    }
  };

  // No show submit
  const handleNoShowSubmit = async (e) => {
    e.preventDefault();
    if (!noShowBookingId.trim()) return;
    setSubmitting(true);
    try {
      await markChannelNoShow({ hotelId, bookingId: noShowBookingId.trim() });
      showToast(`Reservation ${noShowBookingId} marked as No-Show in Aiosell`);
      setNoShowBookingId("");
    } catch (err) {
      alert(err.message || "Failed to mark no show");
    } finally {
      setSubmitting(false);
    }
  };

  const dates = ratesData?.dates || [];
  const roomTypes = ratesData?.roomTypes || [];
  const invSummary = inventoryData?.summary;
  const invRoomTypes = inventoryData?.roomTypes || [];

  return (
    <div className="space-y-4">
      {/* HEADER WITH PROPERTY NAME */}
      {hotelName && (
        <div className="text-brand-700/60 flex items-center justify-between text-xs">
          <span>
            Active Property:{" "}
            <strong className="text-brand-900">{hotelName}</strong>
          </span>
          <span>
            Dates Window:{" "}
            <strong className="text-brand-900">{startDate}</strong> to{" "}
            <strong className="text-brand-900">{endDate}</strong> (10 Days)
          </span>
        </div>
      )}

      {/* TOAST ALERT */}
      {toast && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3.5 text-sm shadow-xs transition ${
            toast.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="font-medium">{toast.msg}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-xs font-semibold"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle size={17} />
            <span>Aiosell Live Sync Notice</span>
          </div>
          <p className="mt-1 text-xs text-rose-600">{error}</p>
        </div>
      )}

      {/* TOP CONTROLS BAR */}
      <div className="border-surface-200 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
        {/* Left: View Mode Tabs */}
        <div className="bg-brand-950/5 flex items-center gap-1 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setActiveTab("rates")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "rates"
                ? "text-brand-900 bg-white shadow-xs"
                : "text-brand-700/60 hover:text-brand-900"
            }`}
          >
            <TrendingUp size={14} />
            Rates & Inventory
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "inventory"
                ? "text-brand-900 bg-white shadow-xs"
                : "text-brand-700/60 hover:text-brand-900"
            }`}
          >
            <Layers size={14} />
            Update Available Rooms
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("restrictions")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "restrictions"
                ? "text-brand-900 bg-white shadow-xs"
                : "text-brand-700/60 hover:text-brand-900"
            }`}
          >
            <Sliders size={14} />
            Restrictions & Operations
          </button>
        </div>

        {/* Center/Right: Date Pickers & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="border-surface-200 flex items-center gap-1.5 rounded-xl border bg-white px-2.5 py-1.5 text-xs">
            <span className="text-brand-700/60 font-semibold">Start Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-brand-900 border-none bg-transparent text-xs font-medium outline-none focus:ring-0"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev10}
              className="border-surface-200 text-brand-700/60 hover:bg-brand-950/5 rounded-lg border p-1.5"
              title="Previous 10 Days"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="border-surface-200 text-brand-700/60 hover:bg-brand-950/5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNext10}
              className="border-surface-200 text-brand-700/60 hover:bg-brand-950/5 rounded-lg border p-1.5"
              title="Next 10 Days"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="border-surface-200 text-brand-900 hover:bg-brand-950/5 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Fetching…" : "Refresh"}
          </button>

          {activeTab === "rates" && (
            <button
              type="button"
              onClick={() => {
                setBulkStart(startDate);
                setBulkEnd(addDays(startDate, 9));
                setBulkRateModalOpen(true);
              }}
              className="bg-primary-600 hover:bg-primary-500 flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition"
            >
              <Edit3 size={13} />
              Bulk Update Rates
            </button>
          )}

          {activeTab === "inventory" && (
            <button
              type="button"
              onClick={() => {
                setBulkInvStart(startDate);
                setBulkInvEnd(addDays(startDate, 9));
                setBulkInvModalOpen(true);
              }}
              className="bg-primary-600 hover:bg-primary-500 flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition"
            >
              <Edit3 size={13} />
              Bulk Update Inventory
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: RATES & INVENTORY (AIOSELL MATRIX) */}
      {activeTab === "rates" && (
        <div className="border-surface-200 overflow-hidden rounded-2xl border bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              {/* TABLE HEADER DATES */}
              <thead>
                <tr className="border-surface-200 border-b bg-gray-50/80 text-[11px] font-semibold text-gray-600">
                  <th className="sticky left-0 z-10 min-w-[220px] bg-gray-50/95 px-4 py-3 backdrop-blur-xs">
                    Rates & Inventory
                  </th>
                  {dates.map((d) => {
                    const { day, weekday } = formatDateHeader(d);
                    const isToday = d === new Date().toISOString().slice(0, 10);
                    return (
                      <th
                        key={d}
                        className={`min-w-[80px] border-l border-gray-100 px-3 py-2 text-center ${
                          isToday
                            ? "text-brand-900 bg-amber-50/60 font-bold"
                            : ""
                        }`}
                      >
                        <div className="font-semibold">{day}</div>
                        <div className="text-[10px] font-normal text-gray-400 uppercase">
                          {weekday}
                        </div>
                      </th>
                    );
                  })}
                </tr>

                {/* AVAILABLE ROOMS (OCCUPANCY %) SUMMARY ROW */}
                <tr className="border-surface-200/60 bg-background-50 text-brand-900 border-b text-xs font-medium">
                  <td className="bg-background-50 sticky left-0 z-10 px-4 py-2.5 font-semibold backdrop-blur-xs">
                    Available Rooms (Occupancy %)
                  </td>
                  {dates.map((d) => {
                    const avail = invSummary?.totalAvailable?.[d] ?? "—";
                    const occ = invSummary?.occupancyPercentage?.[d];
                    return (
                      <td
                        key={d}
                        className="border-l border-gray-100 px-2 py-2 text-center"
                      >
                        <div className="text-xs font-bold text-gray-900">
                          {avail}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {occ != null ? `(${occ}%)` : "—"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </thead>

              {/* TABLE BODY (GROUPED BY ROOM TYPE & RATE PLANS) */}
              <tbody className="divide-y divide-gray-100 text-xs">
                {roomTypes.map((rt) => {
                  return (
                    <div key={rt.roomCode} style={{ display: "contents" }}>
                      {/* ROOM TYPE SECTION HEADER */}
                      <tr className="bg-gray-100/60 font-bold text-gray-900">
                        <td className="sticky left-0 z-10 bg-gray-100/90 px-4 py-2 tracking-wide uppercase backdrop-blur-xs">
                          <div className="flex items-center gap-2">
                            <span className="bg-primary-500 h-2 w-2 rounded-full" />
                            <span>{rt.name || rt.roomCode.toUpperCase()}</span>
                          </div>
                        </td>
                        {dates.map((d) => {
                          const invMatch = invRoomTypes.find(
                            (ir) => ir.roomCode === rt.roomCode,
                          );
                          const avail = invMatch?.available?.[d] ?? "—";
                          return (
                            <td
                              key={d}
                              className="border-l border-gray-200/60 px-2 py-1.5 text-center font-bold text-gray-800"
                            >
                              {avail}
                            </td>
                          );
                        })}
                      </tr>

                      {/* RATE PLANS UNDER ROOM TYPE */}
                      {rt.ratePlans?.map((rp) => (
                        <tr
                          key={rp.ratePlanCode}
                          className="transition-colors hover:bg-amber-50/30"
                        >
                          <td className="sticky left-0 z-10 border-r border-gray-100 bg-white px-4 py-2.5 pl-8 text-xs font-medium text-gray-700 backdrop-blur-xs hover:bg-amber-50/30">
                            <div
                              className="max-w-[200px] truncate"
                              title={rp.name || rp.ratePlanCode}
                            >
                              {rp.name || rp.ratePlanCode}
                            </div>
                          </td>
                          {dates.map((d) => {
                            const rateVal = rp.rates?.[d];
                            return (
                              <td
                                key={d}
                                onClick={() => {
                                  setCellEditModal({
                                    type: "rate",
                                    date: d,
                                    roomCode: rt.roomCode,
                                    roomName: rt.name,
                                    planCode: rp.ratePlanCode,
                                    planName: rp.name,
                                    currentVal: rateVal || 0,
                                  });
                                  setEditValue(rateVal ? String(rateVal) : "");
                                }}
                                className="group hover:bg-primary-50/50 cursor-pointer border-l border-gray-100 px-2 py-2 text-center transition-colors"
                              >
                                <div className="text-brand-900 font-semibold">
                                  {rateVal != null ? `₹${rateVal}` : "—"}
                                </div>
                                <div className="text-primary-600 mt-0.5 hidden text-[9px] font-semibold group-hover:block">
                                  edit
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </div>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: UPDATE AVAILABLE ROOMS (INVENTORY MATRIX) */}
      {activeTab === "inventory" && (
        <div className="border-surface-200 overflow-hidden rounded-2xl border bg-white shadow-xs">
          <div className="border-surface-200 flex items-center justify-between border-b p-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                Update Available Rooms
              </h4>
              <p className="text-xs text-gray-500">
                Live room availability by type across selected dates.
              </p>
            </div>
            <div className="text-xs text-gray-500">
              Total Property Capacity:{" "}
              <strong className="text-gray-800">
                {invSummary?.totalCapacity || 0} rooms
              </strong>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead>
                <tr className="border-surface-200 border-b bg-gray-50/80 text-[11px] font-semibold text-gray-600">
                  <th className="sticky left-0 z-10 min-w-[200px] bg-gray-50/95 px-4 py-3 backdrop-blur-xs">
                    Room
                  </th>
                  {dates.map((d) => {
                    const { day, weekday } = formatDateHeader(d);
                    return (
                      <th
                        key={d}
                        className="min-w-[80px] border-l border-gray-100 px-3 py-2 text-center"
                      >
                        <div className="font-semibold">{day}</div>
                        <div className="text-[10px] font-normal text-gray-400 uppercase">
                          {weekday}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {invRoomTypes.map((rt) => (
                  <tr
                    key={rt.roomCode}
                    className="transition hover:bg-gray-50/50"
                  >
                    <td className="sticky left-0 z-10 border-r border-gray-100 bg-white px-4 py-2.5 font-semibold text-gray-900 uppercase backdrop-blur-xs hover:bg-gray-50/50">
                      {rt.name || rt.roomCode}
                    </td>
                    {dates.map((d) => {
                      const avail = rt.available?.[d];
                      return (
                        <td
                          key={d}
                          onClick={() => {
                            setCellEditModal({
                              type: "inv",
                              date: d,
                              roomCode: rt.roomCode,
                              roomName: rt.name,
                              currentVal: avail != null ? avail : 0,
                            });
                            setEditValue(avail != null ? String(avail) : "0");
                          }}
                          className="group hover:bg-primary-50/50 cursor-pointer border-l border-gray-100 px-2 py-2 text-center transition-colors"
                        >
                          <div className="font-bold text-gray-900">
                            {avail != null ? avail : "—"}
                          </div>
                          <div className="text-primary-600 mt-0.5 hidden text-[9px] font-semibold group-hover:block">
                            edit
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* TOTAL AVAILABLE ROOMS ROW */}
                <tr className="border-t-2 border-gray-200 bg-gray-50/80 font-bold text-gray-900">
                  <td className="sticky left-0 z-10 bg-gray-50/95 px-4 py-2.5 backdrop-blur-xs">
                    Total Available Rooms
                  </td>
                  {dates.map((d) => (
                    <td
                      key={d}
                      className="text-primary-700 border-l border-gray-200 px-2 py-2 text-center"
                    >
                      {invSummary?.totalAvailable?.[d] ?? "—"}
                    </td>
                  ))}
                </tr>

                {/* OCCUPANCY PERCENTAGE ROW */}
                <tr className="bg-gray-50/80 font-bold text-gray-900">
                  <td className="sticky left-0 z-10 bg-gray-50/95 px-4 py-2.5 backdrop-blur-xs">
                    Occupancy Percentage
                  </td>
                  {dates.map((d) => {
                    const occ = invSummary?.occupancyPercentage?.[d];
                    return (
                      <td
                        key={d}
                        className="border-l border-gray-200 px-2 py-2 text-center text-amber-700"
                      >
                        {occ != null ? `${occ} %` : "—"}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: RESTRICTIONS & OPERATIONS */}
      {activeTab === "restrictions" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Restrictions Card */}
          <div className="border-surface-200 flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Sliders size={18} className="text-primary-600" />
                <h4 className="text-sm font-bold text-gray-900">
                  Push Rate & Inventory Restrictions
                </h4>
              </div>
              <p className="mb-4 text-xs text-gray-500">
                Apply CTA (Closed to Arrival), CTD (Closed to Departure), Stop
                Sell, or Minimum Stay across OTAs for specific dates.
              </p>

              <form
                onSubmit={handleRestrictionsSubmit}
                id="restrictionsForm"
                className="space-y-3.5 text-xs"
              >
                {/* Scope selector */}
                <div>
                  <label className="mb-1.5 block font-semibold text-gray-700">
                    Restriction Target
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-gray-200 bg-gray-100 p-1">
                    <button
                      type="button"
                      onClick={() => setRestScope("rate")}
                      className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                        restScope === "rate"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Rate Plan
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestScope("inventory")}
                      className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                        restScope === "inventory"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Room Inv
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestScope("both")}
                      className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                        restScope === "both"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Both
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={restStart}
                      onChange={(e) => setRestStart(e.target.value)}
                      required
                      className="border-surface-200 w-full rounded-lg border p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={restEnd}
                      onChange={(e) => setRestEnd(e.target.value)}
                      required
                      className="border-surface-200 w-full rounded-lg border p-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-gray-700">
                    Room Type
                  </label>
                  <select
                    value={restRoomCode}
                    onChange={(e) => setRestRoomCode(e.target.value)}
                    required
                    className="border-surface-200 w-full rounded-lg border p-2 text-xs"
                  >
                    <option value="">Select Room Type...</option>
                    {roomTypes.map((rt) => (
                      <option key={rt.roomCode} value={rt.roomCode}>
                        {rt.name || rt.roomCode}
                      </option>
                    ))}
                  </select>
                </div>

                {restScope !== "inventory" && (
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">
                      Rate Plan (Optional)
                    </label>
                    <select
                      value={restPlanCode}
                      onChange={(e) => setRestPlanCode(e.target.value)}
                      className="border-surface-200 w-full rounded-lg border p-2 text-xs"
                    >
                      <option value="">All Plans for this Room Type</option>
                      {roomTypes
                        .filter(
                          (rt) => !restRoomCode || rt.roomCode === restRoomCode,
                        )
                        .flatMap((rt) => rt.ratePlans || [])
                        .map((rp) => (
                          <option key={rp.ratePlanCode} value={rp.ratePlanCode}>
                            {rp.name || rp.ratePlanCode}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {restScope !== "inventory" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block font-semibold text-gray-700">
                        Min Stay (Nights)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={minStay}
                        onChange={(e) => setMinStay(e.target.value)}
                        placeholder="e.g. 2"
                        className="border-surface-200 w-full rounded-lg border p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-gray-700">
                        Max Stay (Nights)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={maxStay}
                        onChange={(e) => setMaxStay(e.target.value)}
                        placeholder="e.g. 14"
                        className="border-surface-200 w-full rounded-lg border p-2 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={stopSell}
                      onChange={(e) => setStopSell(e.target.checked)}
                      className="rounded accent-red-600"
                    />
                    <span className="font-semibold text-red-600">
                      Stop Sell
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={cta}
                      onChange={(e) => setCta(e.target.checked)}
                      className="rounded accent-teal-600"
                    />
                    <span>Close to Arrival (CTA)</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={ctd}
                      onChange={(e) => setCtd(e.target.checked)}
                      className="rounded accent-teal-600"
                    />
                    <span>Close to Departure (CTD)</span>
                  </label>
                </div>

                <div className="border-surface-200 border-t pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary-600 hover:bg-primary-500 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Sliders size={15} />
                    {submitting
                      ? "Pushing Restrictions to Aiosell…"
                      : "Push Restrictions to Aiosell"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Mark No-Show Card */}
          <div className="border-surface-200 flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Lock size={18} className="text-amber-600" />
                <h4 className="text-sm font-bold text-gray-900">
                  Mark Reservation as No-Show
                </h4>
              </div>
              <p className="mb-4 text-xs text-gray-500">
                Directly report a guest No-Show to Aiosell for OTA channel
                commission waiver and channel audit.
              </p>

              <form
                onSubmit={handleNoShowSubmit}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">
                    Aiosell Booking ID / Reservation ID
                  </label>
                  <input
                    type="text"
                    value={noShowBookingId}
                    onChange={(e) => setNoShowBookingId(e.target.value)}
                    required
                    placeholder="e.g. AS-BK-984321"
                    className="border-surface-200 w-full rounded-lg border p-2 text-xs"
                  />
                </div>

                <div className="border-surface-200 border-t pt-3">
                  <button
                    type="submit"
                    disabled={submitting || !noShowBookingId.trim()}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-amber-500 disabled:opacity-50"
                  >
                    <Lock size={15} />
                    {submitting
                      ? "Submitting No-Show…"
                      : "Mark No-Show in Aiosell"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QUICK CELL EDIT MODAL */}
      {cellEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="border-surface-200 w-full max-w-sm rounded-2xl border bg-white p-5 shadow-xl">
            <div className="border-surface-200 flex items-center justify-between border-b pb-2.5">
              <h3 className="text-sm font-bold text-gray-900">
                {cellEditModal.type === "rate"
                  ? "Update Rate"
                  : "Update Available Inventory"}
              </h3>
              <button
                type="button"
                onClick={() => setCellEditModal(null)}
                className="text-sm font-semibold text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              <strong>
                {cellEditModal.roomName || cellEditModal.roomCode}
              </strong>
              {cellEditModal.planName ? ` · ${cellEditModal.planName}` : ""}
              <br />
              Date:{" "}
              <span className="text-brand-900 font-semibold">
                {cellEditModal.date}
              </span>
            </p>
            <form onSubmit={handleSaveCell} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-gray-700">
                  {cellEditModal.type === "rate"
                    ? "Rate (₹)"
                    : "Available Rooms Count"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  required
                  autoFocus
                  className="border-surface-200 focus:border-primary-500 w-full rounded-lg border p-2 text-sm font-semibold focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCellEditModal(null)}
                  disabled={submitting}
                  className="rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary-600 hover:bg-primary-500 cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? "Pushing…" : "Push to Aiosell"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK RATE MODAL */}
      {bulkRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="border-surface-200 w-full max-w-md rounded-2xl border bg-white p-5 shadow-xl">
            <div className="border-surface-200 flex items-center justify-between border-b pb-2.5">
              <h3 className="text-sm font-bold text-gray-900">
                Bulk Update Rates
              </h3>
              <button
                type="button"
                onClick={() => setBulkRateModalOpen(false)}
                className="text-sm font-semibold text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleBulkRateSubmit}
              className="mt-4 space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={bulkStart}
                    onChange={(e) => setBulkStart(e.target.value)}
                    required
                    className="border-surface-200 w-full rounded-lg border p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={bulkEnd}
                    onChange={(e) => setBulkEnd(e.target.value)}
                    required
                    className="border-surface-200 w-full rounded-lg border p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700">
                  Room Type
                </label>
                <select
                  value={bulkRoomCode}
                  onChange={(e) => setBulkRoomCode(e.target.value)}
                  className="border-surface-200 w-full rounded-lg border p-2 text-xs"
                >
                  <option value="all">All Room Types</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.roomCode} value={rt.roomCode}>
                      {rt.name || rt.roomCode}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700">
                  Rate Plan
                </label>
                <select
                  value={bulkPlanCode}
                  onChange={(e) => setBulkPlanCode(e.target.value)}
                  className="border-surface-200 w-full rounded-lg border p-2 text-xs"
                >
                  <option value="all">All Rate Plans</option>
                  {roomTypes
                    .flatMap((rt) => rt.ratePlans || [])
                    .map((rp) => (
                      <option key={rp.ratePlanCode} value={rp.ratePlanCode}>
                        {rp.name || rp.ratePlanCode}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700">
                  New Rate (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  value={bulkRateVal}
                  onChange={(e) => setBulkRateVal(e.target.value)}
                  required
                  placeholder="e.g. 3500"
                  className="border-surface-200 w-full rounded-lg border p-2 text-sm font-semibold"
                />
              </div>

              <div className="border-surface-200 flex items-center justify-end gap-2 border-t pt-2">
                <button
                  type="button"
                  onClick={() => setBulkRateModalOpen(false)}
                  disabled={submitting}
                  className="rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary-600 hover:bg-primary-500 cursor-pointer rounded-lg px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? "Pushing…" : "Push Rates to Aiosell"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK INVENTORY MODAL */}
      {bulkInvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="border-surface-200 w-full max-w-md rounded-2xl border bg-white p-5 shadow-xl">
            <div className="border-surface-200 flex items-center justify-between border-b pb-2.5">
              <h3 className="text-sm font-bold text-gray-900">
                Bulk Update Available Rooms
              </h3>
              <button
                type="button"
                onClick={() => setBulkInvModalOpen(false)}
                className="text-sm font-semibold text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleBulkInvSubmit}
              className="mt-4 space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={bulkInvStart}
                    onChange={(e) => setBulkInvStart(e.target.value)}
                    required
                    className="border-surface-200 w-full rounded-lg border p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={bulkInvEnd}
                    onChange={(e) => setBulkInvEnd(e.target.value)}
                    required
                    className="border-surface-200 w-full rounded-lg border p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700">
                  Room Type
                </label>
                <select
                  value={bulkInvRoomCode}
                  onChange={(e) => setBulkInvRoomCode(e.target.value)}
                  required
                  className="border-surface-200 w-full rounded-lg border p-2 text-xs"
                >
                  <option value="">Select Room Type...</option>
                  {invRoomTypes.map((rt) => (
                    <option key={rt.roomCode} value={rt.roomCode}>
                      {rt.name || rt.roomCode}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700">
                  Available Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={bulkInvCount}
                  onChange={(e) => setBulkInvCount(e.target.value)}
                  required
                  placeholder="e.g. 5"
                  className="border-surface-200 w-full rounded-lg border p-2 text-sm font-semibold"
                />
              </div>

              <div className="border-surface-200 flex items-center justify-end gap-2 border-t pt-2">
                <button
                  type="button"
                  onClick={() => setBulkInvModalOpen(false)}
                  disabled={submitting}
                  className="rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary-600 hover:bg-primary-500 cursor-pointer rounded-lg px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? "Pushing…" : "Push Inventory to Aiosell"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
