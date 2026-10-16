import { SignaturePad, InlineBanner } from "@hotelos/ui/components";

/**
 * Step 7 — Signature: signature pad + terms checkbox. `signed` tracks ink,
 * `dataUrl` is the PNG data URL uploaded with the step save.
 */
export function SignatureStep({
  onSignatureChange,
  termsAccepted,
  onTermsChange,
  hasSignature,
  error,
}) {
  return (
    <div>
      <p className="text-brand-900 text-center text-lg font-semibold">
        Your Signature
      </p>
      <p className="text-surface-500 mt-1 text-center text-sm">
        Please sign below to confirm
      </p>

      <div className="mt-5 space-y-4">
        <SignaturePad
          label="Signature"
          placeholder="Sign here"
          onChange={onSignatureChange}
        />

        <label className="flex items-start gap-2.5 text-left">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onTermsChange(e.target.checked)}
            className="border-surface-300 text-brand-700 focus:ring-brand-200 mt-0.5 h-4 w-4 rounded"
          />
          <span className="text-surface-600 text-xs leading-relaxed">
            I agree to the hotel&apos;s terms and conditions, privacy policy and
            authorize the hotel to collect my details for stay registration.
          </span>
        </label>

        {hasSignature && (
          <p className="text-xs font-medium text-emerald-600">
            ✓ Signature captured
          </p>
        )}

        {error && <InlineBanner variant="error">{error}</InlineBanner>}
      </div>
    </div>
  );
}

export default SignatureStep;
