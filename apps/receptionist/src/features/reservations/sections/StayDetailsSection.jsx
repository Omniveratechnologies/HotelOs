import { useMemo } from "react";
import { Calendar } from "lucide-react";
import { SectionCard, QuantityStepper } from "@hotelos/ui/components";
import { cn } from "@hotelos/utils";
import {
  PURPOSE_OPTIONS,
  BOOKING_SOURCE_OPTIONS,
  GUEST_TYPE_OPTIONS,
} from "./options.js";

const selectClass =
  "text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2";

const NO_ERRORS = {};

/**
 * Wizard step 1 — dates, nights, occupancy, source, purpose and requests.
 * Fully controlled by the parent form state.
 *
 * @param {Object} props
 * @param {{ checkIn: string, checkOut: string, rooms: number, adults: number,
 *   children: number, infants: number, purpose: string, source: string,
 *   guestType: string, specialRequests: string }} props.value
 * @param {(field: string, value: any) => void} props.onChange
 * @param {Record<string, string>} [props.errors]
 * @param {boolean} [props.open]
 * @param {string} [props.summary] - One-line summary when collapsed.
 * @param {() => void} [props.onEdit]
 * @returns {React.ReactElement}
 */
export function StayDetailsSection({
  value,
  onChange,
  errors = NO_ERRORS,
  open = true,
  summary,
  onEdit,
}) {
  const today = new Date().toISOString().slice(0, 10);

  const nights = useMemo(() => {
    if (!value.checkIn || !value.checkOut) return 0;
    const n = Math.round(
      (new Date(value.checkOut) - new Date(value.checkIn)) / 86400000,
    );
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [value.checkIn, value.checkOut]);

  const set = (field) => (e) => onChange(field, e.target ? e.target.value : e);

  return (
    <SectionCard
      number="1"
      title="Stay Details"
      open={open}
      summary={summary}
      onEdit={onEdit}
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-3">
          <label
            htmlFor="stay-checkIn"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Check-in Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Calendar
              size={16}
              className="text-surface-400 pointer-events-none absolute top-3 left-3"
            />
            <input
              id="stay-checkIn"
              type="date"
              min={today}
              value={value.checkIn}
              onChange={set("checkIn")}
              className={cn(
                selectClass,
                "pl-9",
                errors.checkIn && "border-rose-500",
              )}
            />
          </div>
          {errors.checkIn && (
            <p className="mt-1.5 text-xs font-medium text-rose-500">
              {errors.checkIn}
            </p>
          )}
        </div>

        <div className="col-span-12 sm:col-span-3">
          <label
            htmlFor="stay-checkOut"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Check-out Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Calendar
              size={16}
              className="text-surface-400 pointer-events-none absolute top-3 left-3"
            />
            <input
              id="stay-checkOut"
              type="date"
              min={value.checkIn || today}
              value={value.checkOut}
              onChange={set("checkOut")}
              className={cn(
                selectClass,
                "pl-9",
                errors.checkOut && "border-rose-500",
              )}
            />
          </div>
          {errors.checkOut && (
            <p className="mt-1.5 text-xs font-medium text-rose-500">
              {errors.checkOut}
            </p>
          )}
        </div>

        <div className="col-span-6 sm:col-span-2">
          <span className="text-brand-900 mb-1.5 block text-sm font-semibold">
            Nights
          </span>
          <output
            aria-live="polite"
            className="bg-background-100 text-brand-900 flex h-10 w-full items-center rounded-lg px-3 text-sm font-semibold"
          >
            {nights} {nights === 1 ? "Night" : "Nights"}
          </output>
        </div>

        <div className="col-span-6 sm:col-span-4">
          <QuantityStepper
            label="Rooms"
            value={value.rooms}
            min={1}
            max={10}
            onChange={(v) => onChange("rooms", v)}
          />
        </div>

        <div className="col-span-4">
          <QuantityStepper
            label="Adults *"
            value={value.adults}
            min={1}
            max={8}
            onChange={(v) => onChange("adults", v)}
          />
          {errors.adults && (
            <p className="mt-1.5 text-xs font-medium text-rose-500">
              {errors.adults}
            </p>
          )}
        </div>
        <div className="col-span-4">
          <QuantityStepper
            label="Children"
            value={value.children}
            min={0}
            max={6}
            onChange={(v) => onChange("children", v)}
          />
        </div>
        <div className="col-span-4">
          <QuantityStepper
            label="Infants"
            value={value.infants}
            min={0}
            max={4}
            onChange={(v) => onChange("infants", v)}
          />
        </div>

        <div className="col-span-12 sm:col-span-4">
          <label
            htmlFor="stay-purpose"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Purpose of Stay
          </label>
          <select
            id="stay-purpose"
            value={value.purpose}
            onChange={set("purpose")}
            className={selectClass}
          >
            <option value="">Select purpose…</option>
            {PURPOSE_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-12 sm:col-span-4">
          <label
            htmlFor="stay-source"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Booking Source
          </label>
          <select
            id="stay-source"
            value={value.source}
            onChange={set("source")}
            className={selectClass}
          >
            {BOOKING_SOURCE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="text-surface-500 mt-1.5 text-xs">
            Walk-in guests are created at the front desk; OTA bookings arrive
            via channel import.
          </p>
        </div>

        <div className="col-span-12 sm:col-span-4">
          <label
            htmlFor="stay-guestType"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Guest Type
          </label>
          <select
            id="stay-guestType"
            value={value.guestType}
            onChange={set("guestType")}
            className={selectClass}
          >
            {GUEST_TYPE_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-12">
          <label
            htmlFor="stay-specialRequests"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Special Requests
          </label>
          <textarea
            id="stay-specialRequests"
            rows={3}
            value={value.specialRequests}
            onChange={set("specialRequests")}
            placeholder="e.g. High floor, early check-in, extra bed…"
            className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 w-full resize-none rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition outline-none placeholder:text-gray-400 focus:ring-2"
          />
        </div>
      </div>
    </SectionCard>
  );
}

export default StayDetailsSection;
