import { useEffect, useState } from "react";
import { Header } from "@hotelos/ui/components/Header";

import ChannelStatusBadge from "../../components/ChannelStatusBadge.jsx";
import RatePlanModal from "../../components/rate-plans/RatePlanModal.jsx";
import AiosellRatesMatrix from "../../components/rate-plans/AiosellRatesMatrix.jsx";

import {
  getRatePlans,
  deleteRatePlan,
  syncRatePlans,
} from "../../services/ratePlan.service.js";

export default function RatePlansPage() {
  const [viewMode, setViewMode] = useState("matrix"); // "matrix" | "plans"
  const [ratePlans, setRatePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");
  const [removing, setRemoving] = useState("");
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncStartDate, setSyncStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [syncEndDate, setSyncEndDate] = useState(() =>
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  );
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");

  async function handleSyncRates(e) {
    e.preventDefault();
    if (!syncStartDate || !syncEndDate) {
      setSyncError("Please select both start and end dates.");
      return;
    }
    if (syncStartDate > syncEndDate) {
      setSyncError("Start date cannot be after end date.");
      return;
    }
    setSyncing(true);
    setSyncError("");
    try {
      await syncRatePlans({ startDate: syncStartDate, endDate: syncEndDate });
      setToast(`Rate push initiated for ${syncStartDate} to ${syncEndDate}.`);
      setSyncModalOpen(false);
    } catch (err) {
      setSyncError(err.message || "Failed to sync rates.");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getRatePlans();

        if (!cancelled) {
          setRatePlans(data);
          setLoadError("");
        }
      } catch (error) {
        console.error("Failed to load rate plans:", error);

        if (!cancelled) {
          setLoadError(error.message || "Failed to load rate plans");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = ratePlans.filter((plan) => {
    const q = search.trim().toLowerCase();

    if (!q) return true;

    return (
      String(plan.ratePlanCode).toLowerCase().includes(q) ||
      String(plan.roomCode || "")
        .toLowerCase()
        .includes(q) ||
      String(plan.name || "")
        .toLowerCase()
        .includes(q)
    );
  });

  async function handleDelete(plan) {
    if (!window.confirm(`Delete rate plan ${plan.ratePlanCode}?`)) return;

    setRemoving(plan.id);

    try {
      await deleteRatePlan(plan.id);

      setRatePlans((previous) =>
        previous.filter((item) => item.id !== plan.id),
      );
      setToast(`Rate plan ${plan.ratePlanCode} deleted.`);
    } catch (error) {
      console.error("Delete rate plan error:", error);
      setToast(error.message || "Failed to delete rate plan.");
    } finally {
      setRemoving("");
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* TOPBAR */}

      <Header
        pageTitle="Rate Plans"
        pageDescription="Rates for each room type and occupancy."
      >
        <div className="flex items-center rounded-xl border border-gray-200 bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setViewMode("matrix")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "matrix"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Rates Calendar (Aiosell)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("plans")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "plans"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Plan Configurations
          </button>
        </div>

        {viewMode === "plans" && (
          <>
            <button
              type="button"
              onClick={() => setSyncModalOpen(true)}
              disabled={syncing}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              {syncing ? "Syncing…" : "Sync Rates"}
            </button>

            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="bg-primary-400 hover:bg-primary-500 inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-xs transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Add Rate Plan
            </button>
          </>
        )}
      </Header>

      <main className="px-6 py-8 lg:px-10">
        {toast && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {toast}

            <button
              type="button"
              className="ml-4 font-semibold"
              onClick={() => setToast("")}
            >
              OK
            </button>
          </div>
        )}

        {viewMode === "matrix" ? (
          <AiosellRatesMatrix />
        ) : (
          <>
            {/* CHANNEL NOTE */}
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Create or edit a rate plan here and it shows{" "}
              <strong>Under review</strong> until a super admin makes the change
              in the property and verifies it — then it is marked synced.
            </div>

            {loadError && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {loadError}
              </div>
            )}

            {/* TOOLBAR */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-xs">
                <svg
                  className="text-brand-900/40 absolute top-1/2 left-3.5 -translate-y-1/2"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  className="text-brand-900 focus:ring-primary-400 w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-4 pl-10 text-sm outline-hidden focus:ring-2"
                  placeholder="Search rate plans..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <span className="text-brand-900/60 text-sm">
                {filtered.length} of {ratePlans.length} rate plans
              </span>
            </div>

            {/* TABLE */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-205 text-left text-sm">
                  <thead>
                    <tr className="text-brand-900/50 border-b border-gray-100 text-xs font-semibold tracking-wider uppercase">
                      <th className="px-6 py-3.5">Name</th>
                      <th className="px-6 py-3.5">Code</th>
                      <th className="px-6 py-3.5">Room code</th>
                      <th className="px-6 py-3.5">Type / Occ.</th>
                      <th className="px-6 py-3.5">Rate</th>
                      <th className="px-6 py-3.5">Channel</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-brand-900/60 px-6 py-10 text-center"
                        >
                          Loading rate plans...
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-brand-900/60 px-6 py-10 text-center"
                        >
                          {ratePlans.length === 0
                            ? "No rate plans yet. Add your first rate plan to get started."
                            : "No rate plans match your search."}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((plan) => (
                        <tr key={plan.id} className="hover:bg-gray-50/70">
                          <td className="px-6 py-4">
                            <p className="font-display text-brand-900 font-semibold">
                              {plan.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {plan.mealPlan}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-mono text-sm text-gray-700">
                              {plan.ratePlanCode}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            {plan.roomCode ? (
                              <span className="font-mono text-sm text-gray-700">
                                {plan.roomCode}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-gray-700">
                            {plan.roomType}
                            <span className="text-gray-400"> · </span>
                            <span className="capitalize">{plan.occupancy}</span>
                          </td>

                          <td className="text-brand-900 px-6 py-4 font-medium">
                            ₹{Number(plan.rate).toLocaleString()}
                          </td>

                          <td className="px-6 py-4">
                            <ChannelStatusBadge
                              status={plan.channelSyncStatus}
                            />
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditing(plan);
                                  setFormOpen(true);
                                }}
                                className="text-primary-400 hover:text-primary-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(plan)}
                                disabled={removing === plan.id}
                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                {removing === plan.id ? "..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {formOpen && (
        <RatePlanModal
          ratePlan={editing}
          onClose={() => setFormOpen(false)}
          onSaved={(saved) => {
            setRatePlans((previous) => {
              const exists = previous.some((item) => item.id === saved.id);

              if (exists) {
                return previous.map((item) =>
                  item.id === saved.id ? saved : item,
                );
              }

              return [...previous, saved];
            });

            setToast(editing ? "Rate plan updated." : "Rate plan added.");
          }}
        />
      )}

      {syncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Sync Rates to Aiosell
              </h3>
              <button
                type="button"
                onClick={() => setSyncModalOpen(false)}
                className="rounded-lg p-1 text-sm font-semibold text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Aiosell updates channel rates across OTAs for a specific date
              range. Choose the date window to push your rates.
            </p>
            {syncError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
                {syncError}
              </div>
            )}
            <form onSubmit={handleSyncRates} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={syncStartDate}
                    onChange={(e) => setSyncStartDate(e.target.value)}
                    required
                    className="focus:border-brand-500 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={syncEndDate}
                    onChange={(e) => setSyncEndDate(e.target.value)}
                    required
                    className="focus:border-brand-500 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setSyncModalOpen(false)}
                  disabled={syncing}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="bg-primary-500 hover:bg-primary-600 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-xs transition disabled:opacity-50"
                >
                  {syncing ? "Syncing…" : "Push Rates"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
