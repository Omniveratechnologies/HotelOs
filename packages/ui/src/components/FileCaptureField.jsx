import { useEffect, useRef, useState } from "react";
import { cn } from "@hotelos/utils";

const DEFAULT_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

/**
 * Dashed upload/capture zone for a single file (ID scan, photo, document).
 * Offers "Take photo" (mobile camera via the `capture` attribute) and
 * "Upload from device" actions, validates type/size, shows a preview with
 * Retake/Remove and an optional success banner.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.label - Field label.
 * @param {string} [props.helper] - Helper text inside the drop zone.
 * @param {(file: File) => void} props.onCapture - Called with the validated file.
 * @param {() => void} [props.onClear] - Called when the file is removed.
 * @param {{ name: string, previewUrl?: string }} [props.file] - Current file (previewUrl for images).
 * @param {string} [props.accept] - Accepted MIME types (default: JPG/PNG/WEBP/PDF).
 * @param {number} [props.maxSizeMB=5] - Maximum file size in MB.
 * @param {string} [props.error] - External error message.
 * @param {string} [props.successMessage] - Green banner text shown when a file is set.
 * @param {boolean} [props.disabled=false] - Disables capture/upload.
 * @param {string} [props.className] - Extra classes.
 * @returns {React.ReactElement}
 */
export function FileCaptureField({
  label,
  helper = "Take a clear photo or upload your file",
  onCapture,
  onClear,
  file,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 5,
  error,
  successMessage,
  disabled = false,
  className = "",
}) {
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState("");

  // Release object URLs created by the caller through previews
  const [internalPreview, setInternalPreview] = useState(null);
  useEffect(() => {
    return () => {
      if (internalPreview) URL.revokeObjectURL(internalPreview);
    };
  }, [internalPreview]);

  const previewUrl = file?.previewUrl || internalPreview;

  const handleIncoming = (fileList) => {
    const incoming = fileList?.[0];
    if (!incoming) return;

    const allowed = accept.split(",").map((t) => t.trim());
    if (!allowed.includes(incoming.type)) {
      setFileError("Unsupported file type.");
      return;
    }
    if (incoming.size > maxSizeMB * 1024 * 1024) {
      setFileError(`File exceeds the ${maxSizeMB}MB limit.`);
      return;
    }
    setFileError("");
    if (internalPreview) URL.revokeObjectURL(internalPreview);
    setInternalPreview(
      incoming.type.startsWith("image/") ? URL.createObjectURL(incoming) : null,
    );
    onCapture(incoming);
  };

  const handleRemove = () => {
    setFileError("");
    if (internalPreview) {
      URL.revokeObjectURL(internalPreview);
      setInternalPreview(null);
    }
    onClear?.();
  };

  const visibleError = error || fileError;
  const interactionDisabled = disabled;

  return (
    <div className={className}>
      {label && (
        <span className="text-brand-900 mb-1.5 block text-sm font-semibold">
          {label}
        </span>
      )}

      {file && previewUrl ? (
        <div>
          <img
            src={previewUrl}
            alt={file.name || "Captured file preview"}
            className="max-h-56 w-full rounded-xl border border-gray-200 object-contain"
          />
          {successMessage && (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {successMessage}
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={interactionDisabled}
              onClick={() => cameraInputRef.current?.click()}
              className="border-surface-300 text-brand-900 hover:bg-background-100 flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border bg-white text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Retake Photo
            </button>
            <button
              type="button"
              disabled={interactionDisabled}
              onClick={handleRemove}
              className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div
            role="button"
            tabIndex={interactionDisabled ? -1 : 0}
            aria-label={label || "Upload file"}
            aria-disabled={interactionDisabled}
            onKeyDown={(e) => {
              if (
                !interactionDisabled &&
                (e.key === "Enter" || e.key === " ")
              ) {
                e.preventDefault();
                uploadInputRef.current?.click();
              }
            }}
            onClick={() =>
              !interactionDisabled && uploadInputRef.current?.click()
            }
            onDragOver={(e) => {
              e.preventDefault();
              if (!interactionDisabled) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (!interactionDisabled) handleIncoming(e.dataTransfer?.files);
            }}
            className={cn(
              "flex min-h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors outline-none",
              interactionDisabled
                ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                : isDragging
                  ? "border-brand-500 bg-brand-50/60"
                  : "hover:border-brand-400 hover:bg-brand-50/40 focus-visible:ring-brand-300 cursor-pointer border-gray-300 bg-gray-50/50 focus-visible:ring-2",
            )}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-surface-400 h-8 w-8"
            >
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span className="text-surface-600 text-sm font-medium">
              {helper}
            </span>
            <span className="text-surface-400 text-xs">
              JPG · PNG · WEBP · PDF — up to {maxSizeMB}MB
            </span>
          </div>

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={interactionDisabled}
              onClick={() => cameraInputRef.current?.click()}
              className="border-surface-300 text-brand-900 hover:bg-background-100 flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border bg-white text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Take Photo
            </button>
            <button
              type="button"
              disabled={interactionDisabled}
              onClick={() => uploadInputRef.current?.click()}
              className="border-surface-300 text-brand-900 hover:bg-background-100 flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border bg-white text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path d="M12 16V4m0 0L6 10m6-6l6 6M4 20h16" />
              </svg>
              Upload from Device
            </button>
          </div>
        </div>
      )}

      {visibleError && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-rose-500">
          {visibleError}
        </p>
      )}

      {/* Hidden inputs — one plain picker, one mobile camera capture */}
      <input
        ref={uploadInputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={interactionDisabled}
        onChange={(e) => {
          handleIncoming(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={interactionDisabled}
        onChange={(e) => {
          handleIncoming(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default FileCaptureField;
