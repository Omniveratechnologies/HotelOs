import { useMemo, useState } from "react";
import { deriveRatePlanCode } from "@hotelos/utils";
import { useAiosellRoomTypes } from "../../settings/hooks/useHotelSettings.js";

const OCCUPANCIES = ["single", "double", "triple", "quad"];
const MEAL_PLANS = ["EP", "CP", "MAP", "AP"];

const inputClass =
  "focus:border-primary-400 mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-hidden";

export default function RatePlanModal({ ratePlan, onClose, onSaved }) {
  const [name, setName] = useState(ratePlan?.name || "");
  const [code, setCode] = useState(ratePlan?.roomCode || "");
  const [roomType, setRoomType] = useState(ratePlan?.roomType || "");
  const [rate, setRate] = useState(
    ratePlan?.rate != null ? String(ratePlan.rate) : "",
  );
  const [occupancy, setOccupancy] = useState(ratePlan?.occupancy || "single");
  const [mealPlan, setMealPlan] = useState(ratePlan?.mealPlan || "EP");
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const {
    aiosellRoomTypes: roomTypes,
    isLoading: typesLoading,
    error: typesError,
  } = useAiosellRoomTypes();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const options = useMemo(() => {
    const base = roomTypes.map((t) => ({
      value: t.code,
      label: t.name,
      name: t.name,
      code: t.code,
      description: t.description || "",
    }));

    // Keep an existing rate plan's current type in the list even if the hotel
    // has not synced it yet (legacy / pre-sync plans).
    if (
      ratePlan &&
      ratePlan.roomCode &&
      !base.some((o) => o.value === ratePlan.roomCode)
    ) {
      base.push({
        value: ratePlan.roomCode,
        label: ratePlan.roomType,
        name: ratePlan.roomType,
        code: ratePlan.roomCode,
        description: "",
      });
    }

    return base;
  }, [roomTypes, ratePlan]);

  const selected = options.find((o) => o.value === code) || null;
  const noTypes = !typesLoading && options.length === 0;

  // The rate plan code is constructive (room code + occupancy + meal plan) and
  // never edited directly — it is derived and sent automatically.
  const derivedCode = deriveRatePlanCode(code, occupancy, mealPlan);

  const handleRoomCodeChange = (nextCode) => {
    setCode(nextCode);
    const option = options.find((o) => o.value === nextCode);
    if (option) {
      setRoomType(option.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter a name for the rate plan.");
      return;
    }

    if (!code || !roomType.trim()) {
      setError("Please pick a room type.");
      return;
    }

    if (!derivedCode) {
      setError("Rate plan code could not be generated.");
      return;
    }

    if (!rate || Number(rate) <= 0) {
      setError("Please enter a valid rate.");
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      setError("End date must be on or after start date.");
      return;
    }

    try {
      setSaving(true);
      await onSaved({
        name: name.trim(),
        ratePlanCode: derivedCode.toLowerCase(),
        roomCode: code.toLowerCase(),
        roomType,
        rate: Number(rate),
        occupancy,
        mealPlan,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      onClose();
    } catch (err) {
      console.error("Failed to save rate plan:", err);
      setError(err.message || "Failed to save rate plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-brand-900 flex items-center justify-between rounded-t-2xl p-5">
          <div>
            <div className="text-primary-400 text-xs font-semibold tracking-widest uppercase">
              {ratePlan ? `Edit ${ratePlan.ratePlanCode}` : "Add Rate Plan"}
            </div>
            <div className="mt-0.5 text-lg font-bold text-white">
              {ratePlan ? "Update Rate Plan" : "Create a New Rate Plan"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 transition-colors hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          <div>
            <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Plan Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Executive Single Room Only"
              autoFocus
              disabled={saving}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Room type *
            </label>
            <select
              value={code}
              onChange={(e) => handleRoomCodeChange(e.target.value)}
              disabled={saving || noTypes}
              className={inputClass}
            >
              {typesLoading && <option value="">Loading…</option>}
              {!typesLoading && noTypes && (
                <option value="">No room types yet</option>
              )}
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label} ({o.code})
                </option>
              ))}
            </select>
            {selected?.description && (
              <p className="mt-1 text-[11px] text-gray-400">
                {selected.description}
              </p>
            )}
            {noTypes && (
              <p className="mt-1 text-[11px] text-amber-600">
                {typesError ||
                  "No room types yet — a super admin must sync the hotel from Aiosell first."}
              </p>
            )}
          </div>

          {code && (
            <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Room type</span>
                <b className="text-gray-700">
                  {roomType || selected?.name || "—"}
                </b>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-gray-500">Rate plan code</span>
                <b className="font-mono text-gray-700">
                  {derivedCode.toLowerCase()}
                </b>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Rate / Night *
              </label>
              <input
                type="number"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="₹2500"
                disabled={saving}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Occupancy *
              </label>
              <select
                value={occupancy}
                onChange={(e) => setOccupancy(e.target.value)}
                disabled={saving}
                className={inputClass}
              >
                {OCCUPANCIES.map((o) => (
                  <option key={o} value={o}>
                    {o.charAt(0).toUpperCase() + o.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Meal Plan *
            </label>
            <select
              value={mealPlan}
              onChange={(e) => setMealPlan(e.target.value)}
              disabled={saving}
              className={inputClass}
            >
              {MEAL_PLANS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Aiosell Date Range Window */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold tracking-wide text-gray-700 uppercase">
                Aiosell Rate Window (Optional)
              </label>
              <span className="text-[11px] text-gray-400">YYYY-MM-DD</span>
            </div>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Aiosell applies rate updates across inclusive date ranges:
            </p>

            <div className="mt-2.5 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-600">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={saving}
                  className="focus:ring-primary-400 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 outline-hidden focus:ring-1"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-600">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={saving}
                  className="focus:ring-primary-400 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 outline-hidden focus:ring-1"
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-gray-400">
            The rate plan code is auto-generated and shown as{" "}
            <b>Under review</b> until a super admin makes the change in the
            property and verifies it.
          </p>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || noTypes}
              className="bg-brand-900 hover:bg-brand-800 flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : ratePlan
                  ? "Save Changes"
                  : "Add Rate Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
