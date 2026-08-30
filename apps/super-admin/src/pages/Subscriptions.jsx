import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CalendarClock, Filter, X, Save, Loader2 } from "lucide-react";

import Topbar from "../components/layout/Topbar.jsx";
import Badge from "../components/ui/Badge.jsx";
import { TableSkeleton, EmptyState } from "../components/ui/States.jsx";

import {
  fetchSubscriptions,
  saveSubscription,
} from "../services/subscriptions.service.js";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  {
    key: "expiring_soon",
    label: "Expiring soon",
  },
  {
    key: "expired",
    label: "Expired",
  },
];

const PLANS = [
  {
    value: "BASIC",
    label: "Basic",
  },
  {
    value: "PRO",
    label: "Pro",
  },
  {
    value: "ENTERPRISE",
    label: "Enterprise",
  },
];

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatInputDate = (date) => {
  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");

  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function Subscriptions() {
  const { onMenuClick } = useOutletContext();

  const [subs, setSubs] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");

  // =====================================================
  // MANAGE MODAL
  // =====================================================

  const [selectedHotel, setSelectedHotel] = useState(null);

  const [form, setForm] = useState({
    plan: "BASIC",
    startDate: "",
    endDate: "",
  });

  const [saving, setSaving] = useState(false);

  const [saveError, setSaveError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  // =====================================================
  // LOAD SUBSCRIPTIONS
  // =====================================================

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await fetchSubscriptions();

      setSubs(data);
    } catch (err) {
      console.error("Failed to load subscriptions:", err);

      setError(err.message || "Failed to load subscriptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  // =====================================================
  // FILTER
  // =====================================================

  const filtered = useMemo(() => {
    if (filter === "all") {
      return subs;
    }

    return subs.filter((subscription) => subscription.status === filter);
  }, [subs, filter]);

  // =====================================================
  // EXPIRING COUNT
  // =====================================================

  const expiringCount = subs.filter(
    (subscription) => subscription.status === "expiring_soon",
  ).length;

  // =====================================================
  // OPEN MANAGE MODAL
  // =====================================================

  const openManageModal = (hotel) => {
    setSelectedHotel(hotel);

    setSaveError("");

    setSuccessMessage("");

    setForm({
      plan: hotel.plan || "BASIC",

      startDate: formatInputDate(hotel.startDate),

      endDate: formatInputDate(hotel.endDate),
    });
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeManageModal = () => {
    if (saving) return;

    setSelectedHotel(null);

    setSaveError("");

    setSuccessMessage("");
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // SAVE SUBSCRIPTION
  // =====================================================

  const handleSave = async (event) => {
    event.preventDefault();

    if (!selectedHotel) {
      return;
    }

    setSaveError("");
    setSuccessMessage("");

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!form.plan) {
      setSaveError("Please select a plan.");
      return;
    }

    if (!form.startDate) {
      setSaveError("Please select a start date.");
      return;
    }

    if (!form.endDate) {
      setSaveError("Please select an end date.");
      return;
    }

    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setSaveError("End date must be after start date.");
      return;
    }

    try {
      setSaving(true);

      await saveSubscription(selectedHotel.hotelId, {
        plan: form.plan,
        startDate: form.startDate,
        endDate: form.endDate,
      });

      setSuccessMessage("Subscription saved successfully.");

      // Reload real data from backend
      await loadSubscriptions();

      // Close after short delay
      setTimeout(() => {
        setSelectedHotel(null);
        setSuccessMessage("");
      }, 800);
    } catch (err) {
      console.error("Failed to save subscription:", err);

      setSaveError(err.message || "Failed to save subscription.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Topbar
        title="Subscriptions"
        subtitle={
          expiringCount > 0
            ? `${expiringCount} subscription${
                expiringCount > 1 ? "s" : ""
              } expiring soon`
            : "Manage subscription dates across every hotel"
        }
        onMenuClick={onMenuClick}
      />

      <main className="flex-1 px-5 pb-10 lg:px-8">
        {/* =====================================================
            FILTERS
        ===================================================== */}

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Filter size={15} className="text-ink-muted mr-1" />

          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.key
                  ? "bg-ink-950 text-white"
                  : "text-ink-muted border-line hover:text-ink-body border bg-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* =====================================================
            SUCCESS
        ===================================================== */}

        {successMessage && !selectedHotel && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {/* =====================================================
            LOADING / TABLE
        ===================================================== */}

        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No subscriptions in this filter"
            description="Try selecting a different status."
          />
        ) : (
          <div className="border-line overflow-hidden rounded-2xl border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-line text-ink-muted border-b text-xs font-semibold tracking-wide uppercase">
                    <th className="px-5 py-3.5">Hotel</th>

                    <th className="px-5 py-3.5">Hotel Code</th>

                    <th className="px-5 py-3.5">Plan</th>

                    <th className="px-5 py-3.5">Start Date</th>

                    <th className="px-5 py-3.5">End Date</th>

                    <th className="px-5 py-3.5">Status</th>

                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-line divide-y">
                  {filtered.map((subscription) => (
                    <tr
                      key={subscription.hotelId}
                      className="hover:bg-canvas/60"
                    >
                      {/* HOTEL */}

                      <td className="px-5 py-4">
                        <div className="text-ink-body font-semibold">
                          {subscription.hotelName}
                        </div>

                        <div className="text-ink-muted mt-1 text-xs">
                          {subscription.email}
                        </div>
                      </td>

                      {/* HOTEL CODE */}

                      <td className="text-ink-body px-5 py-4 font-mono text-xs">
                        {subscription.hotelCode || "—"}
                      </td>

                      {/* PLAN */}

                      <td className="px-5 py-4">
                        {subscription.plan ? (
                          <span className="text-ink-body font-semibold">
                            {subscription.plan}
                          </span>
                        ) : (
                          <span className="text-ink-muted">Not assigned</span>
                        )}
                      </td>

                      {/* START DATE */}

                      <td className="text-ink-body px-5 py-4 font-mono text-xs">
                        {formatDate(subscription.startDate)}
                      </td>

                      {/* END DATE */}

                      <td className="text-ink-body px-5 py-4 font-mono text-xs">
                        {formatDate(subscription.endDate)}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        {subscription.status === "no_subscription" ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                            No Subscription
                          </span>
                        ) : (
                          <Badge status={subscription.status} />
                        )}
                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openManageModal(subscription)}
                          className="bg-ink-950 hover:bg-ink-800 rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* =====================================================
          MANAGE SUBSCRIPTION MODAL
      ===================================================== */}

      {selectedHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="border-line flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-ink-body text-lg font-bold">
                  Manage Subscription
                </h2>

                <p className="text-ink-muted mt-1 text-sm">
                  {selectedHotel.hotelName}
                </p>
              </div>

              <button
                type="button"
                onClick={closeManageModal}
                disabled={saving}
                className="text-ink-muted hover:bg-canvas hover:text-ink-body rounded-lg p-2 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleSave} className="space-y-5 px-6 py-6">
              {/* HOTEL INFORMATION */}

              <div className="bg-canvas rounded-xl p-4">
                <div className="text-ink-muted text-xs font-semibold tracking-wide uppercase">
                  Hotel
                </div>

                <div className="text-ink-body mt-1 font-semibold">
                  {selectedHotel.hotelName}
                </div>

                <div className="text-ink-muted mt-1 text-xs">
                  {selectedHotel.hotelCode}
                </div>
              </div>

              {/* PLAN */}

              <div>
                <label className="text-ink-body mb-2 block text-sm font-semibold">
                  Subscription Plan
                </label>

                <select
                  name="plan"
                  value={form.plan}
                  onChange={handleChange}
                  className="border-line focus:border-ink-950 focus:ring-ink-950/10 w-full rounded-xl border bg-white px-4 py-3 text-sm transition outline-none focus:ring-2"
                >
                  {PLANS.map((plan) => (
                    <option key={plan.value} value={plan.value}>
                      {plan.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* START DATE */}

              <div>
                <label className="text-ink-body mb-2 block text-sm font-semibold">
                  Start Date
                </label>

                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="border-line focus:border-ink-950 focus:ring-ink-950/10 w-full rounded-xl border bg-white px-4 py-3 text-sm transition outline-none focus:ring-2"
                />
              </div>

              {/* END DATE */}

              <div>
                <label className="text-ink-body mb-2 block text-sm font-semibold">
                  End Date
                </label>

                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className="border-line focus:border-ink-950 focus:ring-ink-950/10 w-full rounded-xl border bg-white px-4 py-3 text-sm transition outline-none focus:ring-2"
                />
              </div>

              {/* ERROR */}

              {saveError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {saveError}
                </div>
              )}

              {/* SUCCESS */}

              {successMessage && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </div>
              )}

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeManageModal}
                  disabled={saving}
                  className="border-line text-ink-body hover:bg-canvas rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-ink-950 hover:bg-ink-800 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Subscription
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
