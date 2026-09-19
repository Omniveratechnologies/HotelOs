import { useEffect, useMemo, useState } from "react";

import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";

import {
  createRatePlan,
  updateRatePlan,
} from "../../services/ratePlan.service.js";
import { getAiosellRoomTypes } from "../../services/hotel.service.js";
import { deriveRatePlanCode } from "@hotelos/utils";

const OCCUPANCIES = ["single", "double", "triple", "quad"];
const MEAL_PLANS = ["EP", "CP", "MAP", "AP"];

const selectClass =
  "text-brand-900 focus:ring-primary-400 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 outline-hidden focus:ring-2";

export default function RatePlanModal({ ratePlan, onClose, onSaved }) {
  const [name, setName] = useState(ratePlan?.name || "");
  const [code, setCode] = useState(ratePlan?.roomCode || "");
  const [roomType, setRoomType] = useState(ratePlan?.roomType || "");
  const [rate, setRate] = useState(
    ratePlan?.rate != null ? String(ratePlan.rate) : "2500",
  );
  const [occupancy, setOccupancy] = useState(ratePlan?.occupancy || "single");
  const [mealPlan, setMealPlan] = useState(ratePlan?.mealPlan || "EP");
  const [roomTypes, setRoomTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [typesError, setTypesError] = useState("");
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getAiosellRoomTypes();

        if (!cancelled) {
          setRoomTypes(data || []);
        }
      } catch (error) {
        console.error("Failed to load room types:", error);

        if (!cancelled) {
          setTypesError(error.message || "Could not load room types");
        }
      } finally {
        if (!cancelled) {
          setTypesLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

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

  function handleRoomCodeChange(nextCode) {
    setCode(nextCode);

    const option = options.find((o) => o.value === nextCode);
    if (option) {
      setRoomType(option.name);
    }
  }

  function validate() {
    const next = {};

    if (!name.trim()) next.name = "Name is required.";

    if (!code) next.roomCode = "Pick a room type.";

    const rateNum = Number(rate);

    if (rate === "" || Number.isNaN(rateNum) || rateNum < 0) {
      next.rate = "Enter a valid rate.";
    }

    if (!OCCUPANCIES.includes(occupancy))
      next.occupancy = "Pick a valid occupancy.";

    if (!MEAL_PLANS.includes(mealPlan))
      next.mealPlan = "Pick a valid meal plan.";

    if (startDate && endDate && startDate > endDate) {
      next.endDate = "End date must be on or after start date.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate() || !roomType.trim()) return;

    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        ratePlanCode: derivedCode.toLowerCase(),
        roomCode: code.toLowerCase(),
        roomType,
        rate: Number(rate),
        occupancy,
        mealPlan,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const saved = ratePlan
        ? await updateRatePlan(ratePlan.id, payload)
        : await createRatePlan(payload);

      onSaved?.(saved);
      onClose();
    } catch (error) {
      console.error("Save rate plan error:", error);
      setErrors({ form: error.message || "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={ratePlan ? `Edit ${ratePlan.ratePlanCode}` : "Add Rate Plan"}
      subtitle={
        ratePlan
          ? "Update the rate plan's details."
          : "Create a rate plan for a room type in the hotel."
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          name="name"
          label="Plan name"
          placeholder="e.g. Executive Single Room Only"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <div className="mb-4">
          <label
            htmlFor="ratePlanRoomType"
            className="text-brand-900 mb-2 block text-sm font-medium"
          >
            Room type
          </label>
          <select
            id="ratePlanRoomType"
            className={selectClass}
            value={code}
            onChange={(e) => handleRoomCodeChange(e.target.value)}
            disabled={noTypes}
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
          {errors.roomCode && (
            <p className="mt-2 text-sm text-red-600">{errors.roomCode}</p>
          )}
          {noTypes ? (
            <p className="mt-2 text-xs text-amber-600">
              {typesError ||
                "No room types yet — a super admin must sync the hotel from Aiosell first."}
            </p>
          ) : selected?.description ? (
            <p className="mt-2 text-xs text-gray-500">{selected.description}</p>
          ) : null}
        </div>

        {code && (
          <div className="mb-4 rounded-lg bg-gray-50 px-3.5 py-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Room type</span>
              <span className="font-semibold text-gray-700">
                {roomType || selected?.name || "—"}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-gray-500">Rate plan code</span>
              <span className="font-mono font-semibold text-gray-700">
                {derivedCode.toLowerCase()}
              </span>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="rate"
            label="Rate (₹)"
            type="number"
            min="0"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            error={errors.rate}
          />

          <div className="mb-4">
            <label
              htmlFor="ratePlanOccupancy"
              className="text-brand-900 mb-2 block text-sm font-medium"
            >
              Occupancy
            </label>
            <select
              id="ratePlanOccupancy"
              className={selectClass}
              value={occupancy}
              onChange={(e) => setOccupancy(e.target.value)}
            >
              {OCCUPANCIES.map((o) => (
                <option key={o} value={o}>
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </option>
              ))}
            </select>
            {errors.occupancy && (
              <p className="mt-2 text-sm text-red-600">{errors.occupancy}</p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="ratePlanMeal"
            className="text-brand-900 mb-2 block text-sm font-medium"
          >
            Meal plan
          </label>
          <select
            id="ratePlanMeal"
            className={selectClass}
            value={mealPlan}
            onChange={(e) => setMealPlan(e.target.value)}
          >
            {MEAL_PLANS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Aiosell Date Range Window */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
          <div className="flex items-center justify-between">
            <label className="text-brand-900 text-xs font-semibold tracking-wide uppercase">
              Aiosell Rate Window (Optional)
            </label>
            <span className="text-[11px] text-gray-500">
              Inclusive YYYY-MM-DD
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Aiosell updates rates across specific date ranges. Set the target
            window below:
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="focus:ring-primary-400 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 outline-hidden focus:ring-2"
              />
              {errors.startDate && (
                <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="focus:ring-primary-400 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 outline-hidden focus:ring-2"
              />
              {errors.endDate && (
                <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>
        </div>

        <p className="-mt-2 mb-4 text-xs text-gray-500">
          This plan will show <span className="font-medium">Under review</span>{" "}
          until a super admin creates it in the property and verifies the
          change.
        </p>

        {errors.form && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">
            {errors.form}
          </p>
        )}

        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={noTypes && !ratePlan}
          >
            {ratePlan ? "Save changes" : "Add rate plan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
