import { FileCaptureField } from "@hotelos/ui/components";
import { Plus, Trash2, FileText, Shield } from "lucide-react";
import type { IdDocumentItem } from "../../types/checkIn.types";

const ID_TYPE_OPTIONS = [
  "Aadhaar",
  "Passport",
  "Driving License",
  "Voter ID",
  "PAN Card",
  "Other",
];

const EMPTY_ERRORS: Record<string, string> = {};

interface CaptureIdStepProps {
  documents: IdDocumentItem[];
  onAddDocument: () => void;
  onRemoveDocument: (index: number) => void;
  onDocumentChange: (
    index: number,
    field: keyof IdDocumentItem,
    val: unknown,
  ) => void;
  onDocumentFile: (index: number, side: "front" | "back", file: File) => void;
  uploading?: boolean;
  error?: string;
  errors?: Record<string, string>;
  maxDocuments?: number;
  guestCount?: number;
  isKiosk?: boolean;
}

export function CaptureIdStep({
  documents,
  onAddDocument,
  onRemoveDocument,
  onDocumentChange,
  onDocumentFile,
  uploading = false,
  error,
  errors = EMPTY_ERRORS,
  maxDocuments = 5,
  guestCount = 1,
  isKiosk = false,
}: CaptureIdStepProps) {
  const canAddMore = documents.length < maxDocuments;

  return (
    <div>
      <p className="text-brand-900 text-center text-lg font-semibold">
        Capture Identity Documents
      </p>
      <p className="text-surface-500 mt-1 text-center text-sm">
        Please upload valid identity documents ({documents.length} of max{" "}
        {maxDocuments} for {guestCount} guest{guestCount > 1 ? "s" : ""}).
      </p>
      <p className="text-surface-400 mt-0.5 text-center text-xs">
        Front side is required for each document. All back sides are optional.
      </p>

      <div className="mt-5 space-y-5">
        {documents.map((doc, index) => {
          const frontError = errors[`doc_${index}_front`];
          const idNumError = errors[`doc_${index}_idNumber`];

          return (
            <div
              key={doc.id || `doc_${index}`}
              className="border-surface-200 rounded-2xl border bg-white p-4 shadow-xs sm:p-5"
            >
              {/* Document Header */}
              <div className="border-surface-100 flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-brand-50 text-brand-700 flex h-7 w-7 items-center justify-center rounded-lg">
                    <FileText size={16} />
                  </div>
                  <span className="text-brand-900 text-sm font-bold">
                    Document #{index + 1}
                  </span>
                  {index === 0 && (
                    <span className="bg-brand-100 text-brand-800 rounded-md px-2 py-0.5 text-[10px] font-semibold">
                      Primary Guest
                    </span>
                  )}
                </div>

                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => onRemoveDocument(index)}
                    className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-rose-500 transition hover:text-rose-700"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>

              {/* ID Details Row */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`idType_${index}`}
                    className="text-brand-900 mb-1.5 block text-xs font-semibold"
                  >
                    ID Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id={`idType_${index}`}
                    value={doc.idType}
                    onChange={(e) =>
                      onDocumentChange(index, "idType", e.target.value)
                    }
                    className="text-brand-900 focus:border-brand-500 focus:ring-brand-200 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:ring-2"
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
                    htmlFor={`idNumber_${index}`}
                    className="text-brand-900 mb-1.5 block text-xs font-semibold"
                  >
                    ID Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id={`idNumber_${index}`}
                    value={doc.idNumber}
                    onChange={(e) =>
                      onDocumentChange(index, "idNumber", e.target.value)
                    }
                    placeholder="e.g. 1234 5678 9012"
                    className="text-brand-900 focus:border-brand-500 focus:ring-brand-200 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:ring-2"
                  />
                  {idNumError && (
                    <p className="mt-1 text-xs font-medium text-rose-500">
                      {idNumError}
                    </p>
                  )}
                </div>
              </div>

              {/* Upload Zones: Front (Required) & Back (Optional) */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FileCaptureField
                    label="Front Side *"
                    helper="Take photo or upload front of document"
                    file={
                      doc.front
                        ? {
                            ...doc.front,
                            name:
                              doc.front.filename || `doc_${index + 1}_front`,
                          }
                        : null
                    }
                    onCapture={(file: File) =>
                      onDocumentFile(index, "front", file)
                    }
                    onClear={() => onDocumentChange(index, "front", null)}
                    disabled={uploading}
                    isUploading={Boolean(doc.front?.isUploading)}
                    uploadError={doc.front?.error}
                    onRetry={
                      doc.front?.file
                        ? () => onDocumentFile(index, "front", doc.front!.file!)
                        : undefined
                    }
                    isKiosk={isKiosk}
                    shapeGuide="document"
                    cameraTitle={`Capture Document #${index + 1} (Front)`}
                    successMessage="Front side captured"
                    error={frontError}
                  />
                </div>

                <div>
                  <FileCaptureField
                    label="Back Side (Optional)"
                    helper="Optional — take photo or upload back side"
                    file={
                      doc.back
                        ? {
                            ...doc.back,
                            name: doc.back.filename || `doc_${index + 1}_back`,
                          }
                        : null
                    }
                    onCapture={(file: File) =>
                      onDocumentFile(index, "back", file)
                    }
                    onClear={() => onDocumentChange(index, "back", null)}
                    disabled={uploading}
                    isUploading={Boolean(doc.back?.isUploading)}
                    uploadError={doc.back?.error}
                    onRetry={
                      doc.back?.file
                        ? () => onDocumentFile(index, "back", doc.back!.file!)
                        : undefined
                    }
                    isKiosk={isKiosk}
                    shapeGuide="document"
                    cameraTitle={`Capture Document #${index + 1} (Back)`}
                    successMessage="Back side captured"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Another Document Button */}
        {canAddMore ? (
          <button
            type="button"
            onClick={onAddDocument}
            className="border-brand-300 text-brand-700 hover:bg-brand-50/50 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-3.5 text-xs font-bold transition sm:text-sm"
          >
            <Plus size={18} /> Add Another Document ({documents.length} of max{" "}
            {maxDocuments})
          </button>
        ) : (
          <div className="bg-surface-50 text-surface-500 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-3 text-xs font-medium">
            <Shield size={14} className="text-emerald-600" /> Maximum limit of{" "}
            {maxDocuments} documents reached for this reservation.
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-2 text-center text-xs font-medium text-rose-500"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default CaptureIdStep;
