import type { GuestSummary } from "../../types/checkIn.types";

interface GuestStepProps {
  value: GuestSummary;
  onChange: (field: string, val: string) => void;
  errors?: Record<string, string>;
}

const EMPTY_ERRORS: Record<string, string> = {};

const inputClass = (err?: string) =>
  `text-brand-900 focus:border-brand-500 focus:ring-brand-200 h-11 w-full rounded-lg border bg-white px-3.5 text-sm transition outline-none focus:ring-2 ${
    err ? "border-rose-500" : "border-gray-200"
  }`;

export function GuestStep({
  value,
  onChange,
  errors = EMPTY_ERRORS,
}: GuestStepProps) {
  return (
    <div>
      <p className="text-brand-900 text-center text-lg font-semibold">
        Guest Details
      </p>
      <p className="text-surface-500 mt-1 text-center text-sm">
        Please verify or update your details
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="guestName"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="guestName"
            className={inputClass(errors.name)}
            placeholder="e.g. Rohit Sharma"
            value={value.name || ""}
            onChange={(e) => onChange("name", e.target.value)}
          />
          {errors.name && (
            <p className="mt-1 text-xs font-medium text-rose-500">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="guestEmail"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Email
          </label>
          <input
            id="guestEmail"
            type="email"
            className={inputClass(errors.email)}
            placeholder="you@example.com"
            value={value.email || ""}
            onChange={(e) => onChange("email", e.target.value)}
          />
          {errors.email && (
            <p className="mt-1 text-xs font-medium text-rose-500">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="guestPhone"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <div className="flex">
            <input
              id="guestPhone"
              type="tel"
              inputMode="tel"
              className={`${inputClass(errors.phone)} flex-1`}
              placeholder="+91 98765 43210"
              value={value.phone || ""}
              onChange={(e) => onChange("phone", e.target.value)}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-xs font-medium text-rose-500">
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="guestNationality"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Nationality
          </label>
          <input
            id="guestNationality"
            className={inputClass()}
            placeholder="Indian"
            value={value.nationality || ""}
            onChange={(e) => onChange("nationality", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default GuestStep;
