import { SignaturePad, InlineBanner } from "@hotelos/ui/components";
import { RotateCcw, CheckCircle2 } from "lucide-react";

interface SignatureStepProps {
  signatureUrl?: string | null;
  onClearSavedSignature: () => void;
  hasDrawing: boolean;
  onDrawingChange: (dataUrl: string | null) => void;
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  uploading?: boolean;
  error?: string;
}

export function SignatureStep({
  signatureUrl,
  onClearSavedSignature,
  hasDrawing,
  onDrawingChange,
  termsAccepted,
  onTermsChange,
  uploading = false,
  error,
}: SignatureStepProps) {
  const showPreview = Boolean(signatureUrl);

  return (
    <div>
      <p className="text-brand-900 text-center text-lg font-semibold">
        Your Signature
      </p>
      <p className="text-surface-500 mt-1 text-center text-sm">
        Please sign below to confirm
      </p>

      <div className="mt-5 space-y-4">
        {showPreview ? (
          <div>
            <label className="text-brand-900 mb-1.5 block text-xs font-semibold">
              Signature <span className="text-rose-500">*</span>
            </label>
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
              <div className="flex h-28 w-full items-center justify-center rounded-xl border border-gray-200 bg-white p-3 shadow-2xs">
                <img
                  src={signatureUrl!}
                  alt="Guest signature"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 size={15} /> Signature captured
                </span>
                <button
                  type="button"
                  onClick={onClearSavedSignature}
                  disabled={uploading}
                  className="border-surface-300 text-brand-900 hover:bg-background-100 flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border bg-white px-3 text-xs font-semibold shadow-2xs transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={13} /> Clear &amp; Re-sign
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <SignaturePad
              label="Signature"
              placeholder="Sign here using touch or mouse"
              onChange={onDrawingChange}
              disabled={uploading}
            />
          </div>
        )}

        <label className="flex cursor-pointer items-start gap-2.5 text-left">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onTermsChange(e.target.checked)}
            className="border-surface-300 text-brand-700 focus:ring-brand-200 mt-0.5 h-4 w-4 cursor-pointer rounded"
          />
          <span className="text-surface-600 text-xs leading-relaxed">
            I agree to the hotel&apos;s terms and conditions, privacy policy and
            authorize the hotel to collect my details for stay registration.
          </span>
        </label>

        {!showPreview && hasDrawing && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <CheckCircle2 size={14} /> Signature ready &mdash; click Continue to
            save
          </p>
        )}

        {error && <InlineBanner variant="error">{error}</InlineBanner>}
      </div>
    </div>
  );
}

export default SignatureStep;
