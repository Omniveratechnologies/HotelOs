import { useState } from "react";
import { useLiveRates, useUpdateLiveRates } from "../hooks/useRatePlans.js";

function addDays(isoStr, n) {
  const d = new Date(`${isoStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatDateHeader(isoStr) {
  const d = new Date(`${isoStr}T00:00:00Z`);
  const day = d.getUTCDate();
  const month = d.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const year = String(d.getUTCFullYear()).slice(-2);
  const weekday = d.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
  return { dateText: `${day} ${month} '${year}`, weekday };
}

export default function AiosellRatesMatrix() {
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const endDate = addDays(startDate, 9);

  const {
    data: ratesData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useLiveRates({ startDate, endDate });
  const updateLiveRatesMutation = useUpdateLiveRates();

  const error = queryError
    ? queryError.message || "Failed to load live rates from Aiosell"
    : "";
  const [toast, setToast] = useState(null);

  // Quick cell edit modal
  const [cellEditModal, setCellEditModal] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Bulk rate modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkStart, setBulkStart] = useState(startDate);
  const [bulkEnd, setBulkEnd] = useState(() => addDays(startDate, 9));
  const [bulkRoomCode, setBulkRoomCode] = useState("all");
  const [bulkPlanCode, setBulkPlanCode] = useState("all");
  const [bulkRateVal, setBulkRateVal] = useState("");

  const [submitting, setSubmitting] = useState(false);

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

  const handleCellClick = (date, row) => {
    const currentRate = row.dates[date]?.rate ?? "";
    setCellEditModal({
      date,
      roomCode: row.roomCode,
      roomName: row.roomName,
      planCode: row.planCode,
      planName: row.planName,
      currentRate,
    });
    setEditValue(currentRate ? String(currentRate) : "");
  };

  const handleSaveCell = async (e) => {
    e.preventDefault();
    if (!cellEditModal) return;
    const val = Number(editValue);
    if (isNaN(val) || val <= 0) {
      alert("Please enter a valid rate amount");
      return;
    }
    setSubmitting(true);
    try {
      await updateLiveRatesMutation.mutateAsync({
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
      showToast(
        `Rate updated to ₹${val.toLocaleString()} for ${cellEditModal.date}`,
      );
      setCellEditModal(null);
      await refetch();
    } catch (err) {
      alert(err.message || "Rate update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const val = Number(bulkRateVal);
    if (isNaN(val) || val <= 0) {
      alert("Please enter a valid rate amount");
      return;
    }
    if (bulkStart > bulkEnd) {
      alert("Start date cannot be after end date");
      return;
    }
    setSubmitting(true);
    try {
      const targetRates = [];
      const plans = ratesData?.plans || [];

      for (const p of plans) {
        const roomMatch = bulkRoomCode === "all" || p.roomCode === bulkRoomCode;
        const planMatch = bulkPlanCode === "all" || p.planCode === bulkPlanCode;
        if (roomMatch && planMatch) {
          targetRates.push({
            roomCode: p.roomCode,
            rateplanCode: p.planCode,
            rate: val,
          });
        }
      }

      if (targetRates.length === 0) {
        throw new Error("No rate plans match the selected room/plan filters");
      }

      await updateLiveRatesMutation.mutateAsync({
        updates: [
          { startDate: bulkStart, endDate: bulkEnd, rates: targetRates },
        ],
      });

      showToast(
        `Bulk rate ₹${val.toLocaleString()} pushed for ${bulkStart} to ${bulkEnd}`,
      );
      setBulkModalOpen(false);
      await refetch();
    } catch (err) {
      alert(err.message || "Bulk update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const dates = ratesData?.dates || [];
  const rows = ratesData?.rows?.length
    ? ratesData.rows
    : (ratesData?.roomTypes || []).flatMap((rt) =>
        (rt.ratePlans || []).map((rp) => {
          const datesMap = {};
          for (const d of dates) {
            datesMap[d] = {
              rate: rp.rates?.[d] != null ? rp.rates[d] : null,
              stopSell: false,
            };
          }
          return {
            roomCode: rt.roomCode,
            roomName: rt.name,
            planCode: rp.ratePlanCode,
            planName: rp.name || rp.ratePlanCode,
            dates: datesMap,
          };
        }),
      );

  const plans = ratesData?.plans?.length
    ? ratesData.plans
    : (ratesData?.roomTypes || []).flatMap((rt) =>
        (rt.ratePlans || []).map((rp) => ({
          roomCode: rt.roomCode,
          roomName: rt.name,
          planCode: rp.ratePlanCode,
          planName: rp.name || rp.ratePlanCode,
        })),
      );

  return (
    <div className="space-y-4">
      {/* TOAST */}
      {toast && (
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium ${
            toast.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span>{toast.msg}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-4 cursor-pointer text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ERROR ALERT */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div>
            <p className="font-semibold">Channel Manager Sync Notice</p>
            <p className="mt-0.5 text-xs text-red-600">{error}</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* CALENDAR CONTROLS & HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50/60 p-1">
            <button
              type="button"
              onClick={handlePrev10}
              disabled={loading}
              className="rounded-lg p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900 disabled:opacity-40"
              title="Previous 10 Days"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <span className="px-3 text-xs font-semibold whitespace-nowrap text-gray-800">
              {startDate} <span className="font-normal text-gray-400">to</span>{" "}
              {endDate}
            </span>

            <button
              type="button"
              onClick={handleNext10}
              disabled={loading}
              className="rounded-lg p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900 disabled:opacity-40"
              title="Next 10 Days"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Today
          </button>

          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              if (e.target.value) {
                setStartDate(e.target.value);
              }
            }}
            className="focus:border-brand-500 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none"
          />

          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className={loading ? "text-brand-600 animate-spin" : ""}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            {loading ? "Fetching…" : "Refresh"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setBulkStart(startDate);
              setBulkEnd(endDate);
              setBulkModalOpen(true);
            }}
            className="bg-primary-600 hover:bg-primary-700 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Update Rates in Bulk
          </button>
        </div>
      </div>

      {/* MATRIX TABLE CONTAINER */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="sticky left-0 z-10 min-w-65 border-r border-gray-200 bg-gray-50/95 p-3.5 font-semibold text-gray-700 shadow-[1px_0_0_0_#e5e7eb] backdrop-blur-xs">
                  Room Type & Rate Plan
                </th>
                {dates.map((d) => {
                  const hdr = formatDateHeader(d);
                  return (
                    <th
                      key={d}
                      className="max-w-26.5 min-w-24 border-r border-gray-100 p-2.5 text-center font-semibold text-gray-700 last:border-r-0"
                    >
                      <div className="text-[11px] leading-tight font-bold text-gray-900">
                        {hdr.dateText}
                      </div>
                      <div className="mt-0.5 text-[10px] font-medium text-gray-500 uppercase">
                        {hdr.weekday}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={dates.length + 1}
                    className="p-12 text-center text-sm text-gray-500"
                  >
                    {loading ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg
                          className="text-brand-600 animate-spin"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                        </svg>
                        <span>Loading live rates matrix from Aiosell…</span>
                      </div>
                    ) : (
                      "No rate plans mapped or found for this property."
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={`${row.roomCode}_${row.planCode}`}
                    className="group transition hover:bg-gray-50/60"
                  >
                    <td className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 shadow-[1px_0_0_0_#e5e7eb] transition group-hover:bg-gray-50/60">
                      <div className="max-w-60 truncate text-xs font-semibold text-gray-900">
                        {row.planName || row.planCode}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-gray-500">
                          {row.roomCode}
                        </span>
                        <span className="max-w-42.5 truncate text-[11px] text-gray-500">
                          {row.roomName}
                        </span>
                      </div>
                    </td>

                    {dates.map((d) => {
                      const cell = row.dates[d];
                      const rate = cell?.rate;
                      const hasRate = rate != null && rate !== "";

                      return (
                        <td
                          key={d}
                          onClick={() => handleCellClick(d, row)}
                          className="hover:bg-brand-50/60 group/cell relative cursor-pointer border-r border-gray-100 p-2 text-center transition select-none last:border-r-0"
                          title={`Click to edit rate for ${d}`}
                        >
                          <div className="py-1">
                            {hasRate ? (
                              <div className="group-hover/cell:text-brand-600 text-xs font-semibold text-gray-900 transition">
                                ₹{Number(rate).toLocaleString()}
                              </div>
                            ) : (
                              <div className="text-xs font-normal text-gray-300">
                                —
                              </div>
                            )}

                            {cell?.stopSell && (
                              <span className="mt-0.5 inline-block rounded border border-red-200 bg-red-50 px-1 text-[9px] font-bold text-red-600">
                                Closed
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER NOTE */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 p-3.5 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Live Rate Exchange via Aiosell Channel Manager</span>
          </div>
          <div className="text-[11px] text-gray-400">
            Click any rate cell to quickly modify that day's price or use
            "Update Rates in Bulk".
          </div>
        </div>
      </div>

      {/* QUICK CELL EDIT MODAL */}
      {cellEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="animate-in fade-in zoom-in-95 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Edit Live Rate
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {cellEditModal.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCellEditModal(null)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveCell} className="mt-4 space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-gray-600">
                  Rate Plan
                </label>
                <div className="mt-0.5 text-xs font-semibold text-gray-900">
                  {cellEditModal.planName || cellEditModal.planCode}
                </div>
                <div className="text-[11px] text-gray-500">
                  {cellEditModal.roomName} ({cellEditModal.roomCode})
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  New Rate (₹)
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-gray-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    autoFocus
                    required
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="e.g. 3500"
                    className="focus:border-brand-500 focus:ring-brand-500/20 w-full rounded-xl border border-gray-300 py-2 pr-3 pl-7 text-sm text-gray-900 outline-none focus:ring-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-2">
                <button
                  type="button"
                  onClick={() => setCellEditModal(null)}
                  disabled={submitting}
                  className="rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary-600 hover:bg-primary-700 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Save Rate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK UPDATE MODAL */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="animate-in fade-in zoom-in-95 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Bulk Update Live Rates
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Push rate updates to Aiosell across a specified date range.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bulkStart}
                    onChange={(e) => setBulkStart(e.target.value)}
                    className="focus:border-brand-500 mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bulkEnd}
                    onChange={(e) => setBulkEnd(e.target.value)}
                    className="focus:border-brand-500 mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Room Type
                </label>
                <select
                  value={bulkRoomCode}
                  onChange={(e) => setBulkRoomCode(e.target.value)}
                  className="focus:border-brand-500 mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 outline-none"
                >
                  <option value="all">All Room Types</option>
                  {(ratesData?.roomTypes || []).map((rt) => {
                    const code = rt.code || rt.roomCode;
                    return (
                      <option key={code} value={code}>
                        {rt.name} ({code})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Rate Plan
                </label>
                <select
                  value={bulkPlanCode}
                  onChange={(e) => setBulkPlanCode(e.target.value)}
                  className="focus:border-brand-500 mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 outline-none"
                >
                  <option value="all">All Rate Plans</option>
                  {plans.map((p) => (
                    <option
                      key={`${p.roomCode}_${p.planCode}`}
                      value={p.planCode}
                    >
                      {p.planName || p.planCode} ({p.roomCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  New Rate (₹)
                </label>
                <div className="relative mt-1">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-gray-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={bulkRateVal}
                    onChange={(e) => setBulkRateVal(e.target.value)}
                    placeholder="e.g. 4200"
                    className="focus:border-brand-500 focus:ring-brand-500/20 w-full rounded-xl border border-gray-300 py-2 pr-3 pl-7 text-xs text-gray-900 outline-none focus:ring-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  disabled={submitting}
                  className="rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary-600 hover:bg-primary-700 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? "Pushing Rates…" : "Push Rates to Aiosell"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
