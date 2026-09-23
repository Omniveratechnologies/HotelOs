import { useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import { CalendarClock, Filter, X, Save, Loader2 } from "lucide-react";

import Topbar from "../../../components/layout/Topbar.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import { TableSkeleton, EmptyState } from "../../../components/ui/States.jsx";

import {
  useSubscriptions,
  useSaveSubscription,
} from "../hooks/useSubscriptions.js";

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

export default function SubscriptionsPage() {
  const { onMenuClick } = useOutletContext();

  const {
    subscriptions: subs,
    isLoading: loading,
    error: queryError,
  } = useSubscriptions();
  const saveSubscriptionMut = useSaveSubscription();
  const error = queryError
    ? queryError.message || "Failed to load subscriptions."
    : "";
  const [filter, setFilter] = useState("all");

  const [selectedHotel, setSelectedHotel] = useState(null);
  const [form, setForm] = useState({
    plan: "BASIC",
    startDate: "",
    endDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const filtered = useMemo(() => {
    if (filter === "all") return subs;
    return subs.filter((s) => s.status === filter);
  }, [subs, filter]);

  const expiringCount = useMemo(
    () => subs.filter((s) => s.status === "expiring_soon").length,
    [subs],
  );

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

  const closeManageModal = () => {
    if (saving) return;
    setSelectedHotel(null);
    setSaveError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedHotel) return;

    if (!form.startDate || !form.endDate) {
      setSaveError("Start date and end date are required.");
      return;
    }

    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setSaveError("End date must be after start date.");
      return;
    }

    try {
      setSaving(true);
      setSaveError("");

      await saveSubscriptionMut.mutateAsync({
        hotelId: selectedHotel.hotelId,
        data: {
          plan: form.plan,
          startDate: form.startDate,
          endDate: form.endDate,
        },
      });

      setSuccessMessage("Subscription updated successfully.");
      closeManageModal();
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
        {/* FILTERS */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Filter size={15} className="text-brand-700/60 mr-1" />

          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.key
                  ? "bg-brand-950 text-white"
                  : "text-brand-700/60 border-surface-200 hover:text-brand-900 border bg-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ERROR / SUCCESS */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {successMessage && !selectedHotel && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {/* LOADING / EMPTY / TABLE */}
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No subscriptions in this filter"
            description="Try selecting a different status."
          />
        ) : (
          <div className="border-surface-200 overflow-hidden rounded-2xl border bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-surface-200 text-brand-700/60 border-b text-xs font-semibold tracking-wide uppercase">
                    <th className="px-5 py-3.5">Hotel</th>
                    <th className="px-5 py-3.5">Hotel Code</th>
                    <th className="px-5 py-3.5">Plan</th>
                    <th className="px-5 py-3.5">Start Date</th>
                    <th className="px-5 py-3.5">End Date</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-surface-200 divide-y">
                  {filtered.map((subscription) => (
                    <tr
                      key={subscription.hotelId}
                      className="hover:bg-background-50/60 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="text-brand-900 font-semibold">
                          {subscription.hotelName}
                        </div>
                        <div className="text-brand-700/60 mt-1 text-xs">
                          {subscription.email}
                        </div>
                      </td>

                      <td className="text-brand-900 px-5 py-4 font-mono text-xs">
                        {subscription.hotelCode || "—"}
                      </td>

                      <td className="px-5 py-4">
                        {subscription.plan ? (
                          <span className="text-brand-900 font-semibold">
                            {subscription.plan}
                          </span>
                        ) : (
                          <span className="text-brand-700/60">
                            Not assigned
                          </span>
                        )}
                      </td>

                      <td className="text-brand-900 px-5 py-4 font-mono text-xs">
                        {formatDate(subscription.startDate)}
                      </td>

                      <td className="text-brand-900 px-5 py-4 font-mono text-xs">
                        {formatDate(subscription.endDate)}
                      </td>

                      <td className="px-5 py-4">
                        {subscription.status === "no_subscription" ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                            No Subscription
                          </span>
                        ) : (
                          <Badge status={subscription.status} />
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openManageModal(subscription)}
                          className="bg-brand-950 hover:bg-brand-900 rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition"
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

      {/* MANAGE SUBSCRIPTION MODAL */}
      {selectedHotel && (
        <div className="bg-brand-950/60 fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="border-surface-200 w-full max-w-lg rounded-2xl border bg-white shadow-2xl">
            <div className="border-surface-200 flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="font-display text-brand-900 text-lg font-bold">
                  Manage Subscription
                </h2>
                <p className="text-brand-700/60 mt-1 text-sm">
                  {selectedHotel.hotelName}
                </p>
              </div>

              <button
                type="button"
                onClick={closeManageModal}
                disabled={saving}
                className="text-brand-700/60 hover:bg-background-100 hover:text-brand-900 rounded-lg p-2 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 px-6 py-6">
              <div className="bg-background-50 border-surface-200 rounded-xl border p-4">
                <div className="text-brand-700/60 text-xs font-semibold tracking-wide uppercase">
                  Hotel
                </div>
                <div className="text-brand-900 mt-1 font-semibold">
                  {selectedHotel.hotelName}
                </div>
                <div className="text-brand-700/60 mt-1 text-xs">
                  {selectedHotel.hotelCode}
                </div>
              </div>

              <div>
                <label className="text-brand-900 mb-2 block text-sm font-semibold">
                  Subscription Plan
                </label>
                <select
                  name="plan"
                  value={form.plan}
                  onChange={handleChange}
                  className="border-surface-200 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-xl border bg-white px-4 py-3 text-sm transition outline-none focus:ring-2"
                >
                  {PLANS.map((plan) => (
                    <option key={plan.value} value={plan.value}>
                      {plan.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-brand-900 mb-2 block text-sm font-semibold">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="border-surface-200 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-xl border bg-white px-4 py-3 text-sm transition outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="text-brand-900 mb-2 block text-sm font-semibold">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className="border-surface-200 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-xl border bg-white px-4 py-3 text-sm transition outline-none focus:ring-2"
                />
              </div>

              {saveError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {saveError}
                </div>
              )}

              {successMessage && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeManageModal}
                  disabled={saving}
                  className="border-surface-200 text-brand-900 hover:bg-background-100 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-brand-950 hover:bg-brand-900 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
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
