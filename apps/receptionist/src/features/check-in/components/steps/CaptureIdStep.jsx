import { FileCaptureField } from "@hotelos/ui/components";
import { ID_TYPE_OPTIONS } from "../../../reservations/sections/options.js";

/**
 * Step 4 — Capture ID: type + number + front/back photo via FileCaptureField
 * (camera on mobile, upload fallback).
 */
const EMPTY_ERRORS = {};

export function CaptureIdStep({
  value,
  onChange,
  onFile,
  uploading = false,
  error,
  errors = EMPTY_ERRORS,
}) {
  const needsBack = ["Aadhaar", "Driving License"].includes(value.idType);

  return (
    <div>
      <p className="text-brand-900 text-center text-lg font-semibold">
        Capture Your ID
      </p>
      <p className="text-surface-500 mt-1 text-center text-sm">
        Please take a clear photo or upload your ID card
      </p>

      <div className="mt-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="idType"
              className="text-brand-900 mb-1.5 block text-sm font-semibold"
            >
              ID Type <span className="text-rose-500">*</span>
            </label>
            <select
              id="idType"
              value={value.idType}
              onChange={(e) => onChange("idType", e.target.value)}
              className="text-brand-900 focus:border-brand-500 focus:ring-brand-200 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2"
            >
              {ID_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="idNumber"
              className="text-brand-900 mb-1.5 block text-sm font-semibold"
            >
              ID Number <span className="text-rose-500">*</span>
            </label>
            <input
              id="idNumber"
              value={value.idNumber}
              onChange={(e) => onChange("idNumber", e.target.value)}
              placeholder="e.g. 1234 5678 9012"
              className="text-brand-900 focus:border-brand-500 focus:ring-brand-200 h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 text-sm outline-none focus:ring-2"
            />
            {errors.idNumber && (
              <p className="mt-1 text-xs font-medium text-rose-500">
                {errors.idNumber}
              </p>
            )}
          </div>
        </div>

        <FileCaptureField
          label="ID — Front"
          file={value.idFront}
          onCapture={(file) => onFile("idFront", file)}
          onClear={() => onChange("idFront", null)}
          disabled={uploading}
          successMessage="ID captured successfully"
          error={errors.idFront}
        />

        {needsBack && (
          <FileCaptureField
            label="ID — Back"
            file={value.idBack}
            onCapture={(file) => onFile("idBack", file)}
            onClear={() => onChange("idBack", null)}
            disabled={uploading}
            error={errors.idBack}
          />
        )}

        {error && (
          <p role="alert" className="text-xs font-medium text-rose-500">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default CaptureIdStep;
