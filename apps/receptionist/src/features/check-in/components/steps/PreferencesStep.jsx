import { ToggleRow } from "@hotelos/ui/components";
import { ArrowUp, Cigarette, Plus, Car } from "lucide-react";

const PREFERENCES = [
  {
    key: "high-floor",
    label: "High Floor",
    helper: "Subject to availability",
    icon: ArrowUp,
  },
  {
    key: "non-smoking",
    label: "Non-Smoking Room",
    helper: "Smoke-free stay",
    icon: Cigarette,
  },
  {
    key: "extra-pillow",
    label: "Extra Pillow",
    helper: "Additional comfort items",
    icon: Plus,
  },
  {
    key: "airport-pickup",
    label: "Airport Pickup",
    helper: "Arrange transportation",
    icon: Car,
  },
];

/** Step 8 — Preferences & Requests (toggle rows + free-text remarks). */
export function PreferencesStep({ value, onToggle, remarks, onRemarksChange }) {
  return (
    <div>
      <p className="text-brand-900 text-center text-lg font-semibold">
        Preferences &amp; Requests
      </p>
      <p className="text-surface-500 mt-1 text-center text-sm">
        Help us make your stay better
      </p>

      <div className="mt-5 divide-y divide-gray-100">
        {PREFERENCES.map(({ key, label, helper, icon: Icon }) => (
          <div key={key} className="flex items-center gap-3 py-3">
            <span className="bg-background-100 text-brand-700 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Icon size={18} />
            </span>
            <ToggleRow
              className="flex-1"
              label={label}
              description={helper}
              checked={value.includes(key)}
              onChange={() => onToggle(key)}
            />
          </div>
        ))}
      </div>

      <div className="mt-3">
        <label
          htmlFor="remarks"
          className="text-brand-900 mb-1.5 block text-sm font-semibold"
        >
          Additional Requests (Optional)
        </label>
        <textarea
          id="remarks"
          rows={3}
          value={remarks}
          onChange={(e) => onRemarksChange(e.target.value)}
          placeholder="e.g. early check-in, baby cot, birthday setup…"
          className="text-brand-900 focus:border-brand-500 focus:ring-brand-200 w-full resize-none rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:ring-2"
        />
      </div>
    </div>
  );
}

export default PreferencesStep;
