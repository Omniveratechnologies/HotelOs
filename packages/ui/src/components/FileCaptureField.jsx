import { useEffect, useRef, useState } from "react";
import { cn, isKioskEnvironment } from "@hotelos/utils";
import { CameraCaptureModal } from "./CameraCaptureModal.jsx";

const DEFAULT_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

/**
 * Normalizes common file MIME types for images.
 */
function normalizeMimeType(file) {
  let type = file?.type || "";
  if (type === "image/jpg") type = "image/jpeg";
  if (!type && file?.name) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "jpg" || ext === "jpeg") type = "image/jpeg";
    else if (ext === "png") type = "image/png";
    else if (ext === "webp") type = "image/webp";
    else if (ext === "pdf") type = "application/pdf";
  }
  return type || "image/jpeg";
}

/**
 * FileCaptureField
 *
 * Upload and camera capture field supporting:
 * - In-app CameraCaptureModal with live viewfinder, guide overlay, and shutter capture
 * - Instant local preview (URL.createObjectURL)
 * - In-flight uploading spinner indicator
 * - Inline upload error display with Retry button
 * - Web mode: Both "Take Photo" and "Upload from Device", with camera switch
 * - Kiosk mode: Strictly "Take Photo" (front camera), hiding device upload
 *
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {string} [props.helper] - Helper dropzone text
 * @param {(file: File) => void} props.onCapture - Called with the selected/captured File
 * @param {() => void} [props.onClear] - Called when the file is removed
 * @param {Object} [props.file] - File metadata ({ name, previewUrl, ... })
 * @param {string} [props.accept] - Accepted MIME types
 * @param {number} [props.maxSizeMB=5] - Maximum size in MB
 * @param {string} [props.error] - External validation error
 * @param {string} [props.uploadError] - Specific upload failure message
 * @param {boolean} [props.isUploading] - Whether upload is currently in flight
 * @param {() => void} [props.onRetry] - Retry callback for failed uploads
 * @param {string} [props.successMessage] - Text shown on successful upload
 * @param {boolean} [props.disabled=false] - Disables interactions
 * @param {boolean} [props.isKiosk] - Explicit kiosk override (defaults to isKioskEnvironment())
 * @param {"document" | "portrait" | "none"} [props.shapeGuide="document"] - Camera overlay guide
 * @param {string} [props.cameraTitle] - Camera modal title
 * @param {string} [props.className] - Container classes
 */
export function FileCaptureField({
  label,
  helper,
  onCapture,
  onClear,
  file,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 5,
  error,
  uploadError,
  isUploading = false,
  onRetry,
  successMessage,
  disabled = false,
  isKiosk: isKioskProp,
  shapeGuide = "document",
  cameraTitle,
  className = "",
}) {
  const isKiosk =
    typeof isKioskProp === "boolean" ? isKioskProp : isKioskEnvironment();
  const uploadInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState("");
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // Local state to guarantee immediate preview even if parent state is async
  const [internalPreview, setInternalPreview] = useState(null);
  const [internalFileName, setInternalFileName] = useState("");

  useEffect(() => {
    return () => {
      if (internalPreview) {
        try {
          URL.revokeObjectURL(internalPreview);
        } catch {
          // ignore
        }
      }
    };
  }, [internalPreview]);

  useEffect(() => {
    if (file?.url && internalPreview) {
      try {
        URL.revokeObjectURL(internalPreview);
      } catch {
        // ignore
      }
      // oxlint-disable-next-line react/set-state-in-effect
      setInternalPreview(null);
    }
  }, [file?.url, internalPreview]);

  const previewUrl =
    file?.url && file.url.startsWith("http")
      ? file.url
      : file?.previewUrl && !file.previewUrl.startsWith("blob:")
        ? file.previewUrl
        : internalPreview || file?.previewUrl || file?.url || null;
  const fileName =
    file?.name || file?.filename || internalFileName || "Captured file";
  const hasFile = Boolean(
    (file && (file.key || file.url || file.previewUrl)) || internalPreview,
  );

  const handleIncoming = (fileList) => {
    const incoming = fileList?.[0];
    if (!incoming) return;

    const normalizedType = normalizeMimeType(incoming);
    const allowed = accept.split(",").map((t) => t.trim());

    const isAllowed =
      allowed.includes(normalizedType) ||
      allowed.some(
        (a) => a.endsWith("/*") && normalizedType.startsWith(a.slice(0, -1)),
      ) ||
      incoming.type.startsWith("image/");

    if (!isAllowed) {
      setFileError(
        "Unsupported file type. Please upload a JPG, PNG, WEBP or PDF file.",
      );
      return;
    }

    if (incoming.size > maxSizeMB * 1024 * 1024) {
      setFileError(`File exceeds the ${maxSizeMB}MB limit.`);
      return;
    }

    setFileError("");

    if (internalPreview) {
      try {
        URL.revokeObjectURL(internalPreview);
      } catch {
        // ignore
      }
    }

    const localUrl = URL.createObjectURL(incoming);
    setInternalPreview(localUrl);
    setInternalFileName(incoming.name || "captured_file.jpg");

    onCapture?.(incoming);
  };

  const handleRemove = () => {
    setFileError("");
    if (internalPreview) {
      try {
        URL.revokeObjectURL(internalPreview);
      } catch {
        // ignore
      }
      setInternalPreview(null);
    }
    setInternalFileName("");
    onClear?.();
  };

  const activeError = uploadError || error || fileError;
  const interactionDisabled = disabled || isUploading;

  const defaultHelper = isKiosk
    ? "Tap to take a photo with the kiosk camera"
    : "Take a clear photo or upload your file";
  const effectiveHelper = helper || defaultHelper;

  return (
    <div className={className}>
      {label && (
        <span className="text-brand-900 mb-1.5 block text-sm font-semibold">
          {label}
        </span>
      )}

      {/* Preview View: Shown as soon as a file is chosen or captured */}
      {hasFile && previewUrl ? (
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
          <div className="relative flex max-h-56 w-full items-center justify-center overflow-hidden rounded-xl bg-black/5">
            <img
              src={previewUrl}
              alt={fileName}
              className="max-h-56 w-full object-contain"
            />

            {/* In-Flight Uploading Overlay */}
            {isUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-white backdrop-blur-xs">
                <div className="h-7 w-7 animate-spin rounded-full border-3 border-white/20 border-t-white" />
                <span className="text-xs font-semibold tracking-wide">
                  Uploading to storage...
                </span>
              </div>
            )}
          </div>

          {/* Success Badge */}
          {!isUploading && !activeError && successMessage && (
            <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="h-4 w-4"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {successMessage}
            </p>
          )}

          {/* Inline Upload Error Badge */}
          {activeError && (
            <div className="mt-2.5 rounded-lg border border-rose-200 bg-rose-50/80 p-2.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4 shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {activeError}
              </p>
            </div>
          )}

          {/* Action Buttons Below Preview */}
          <div className="mt-3 flex flex-wrap gap-2">
            {/* Retry Button on failure */}
            {activeError && onRetry && (
              <button
                type="button"
                disabled={isUploading}
                onClick={onRetry}
                className="bg-brand-600 hover:bg-brand-700 flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-xs font-bold text-white shadow-xs transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-3.5 w-3.5"
                >
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
                Retry Upload
              </button>
            )}

            {/* Retake Photo Button */}
            <button
              type="button"
              disabled={interactionDisabled}
              onClick={() => setIsCameraModalOpen(true)}
              className="border-surface-300 text-brand-900 hover:bg-background-100 flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border bg-white text-xs font-semibold shadow-2xs transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3.5 w-3.5"
              >
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Retake Photo
            </button>

            {/* Replace from Device (Web only) */}
            {!isKiosk && (
              <button
                type="button"
                disabled={interactionDisabled}
                onClick={() => uploadInputRef.current?.click()}
                className="border-surface-300 text-brand-900 hover:bg-background-100 flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border bg-white text-xs font-semibold shadow-2xs transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-3.5 w-3.5"
                >
                  <path d="M12 16V4m0 0L6 10m6-6l6 6M4 20h16" />
                </svg>
                Replace File
              </button>
            )}

            {/* Remove Button */}
            <button
              type="button"
              disabled={interactionDisabled}
              onClick={handleRemove}
              className="flex h-9 cursor-pointer items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3.5 w-3.5"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* Empty / Dropzone View */
        <div>
          <div
            role="button"
            tabIndex={interactionDisabled ? -1 : 0}
            aria-label={label || "Capture or upload file"}
            aria-disabled={interactionDisabled}
            onKeyDown={(e) => {
              if (
                !interactionDisabled &&
                (e.key === "Enter" || e.key === " ")
              ) {
                e.preventDefault();
                if (isKiosk) {
                  setIsCameraModalOpen(true);
                } else {
                  uploadInputRef.current?.click();
                }
              }
            }}
            onClick={() => {
              if (interactionDisabled) return;
              if (isKiosk) {
                setIsCameraModalOpen(true);
              } else {
                uploadInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!interactionDisabled && !isKiosk) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (!interactionDisabled && !isKiosk) {
                handleIncoming(e.dataTransfer?.files);
              }
            }}
            className={cn(
              "flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors outline-none",
              interactionDisabled
                ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                : isDragging
                  ? "border-brand-500 bg-brand-50/60"
                  : "hover:border-brand-400 hover:bg-brand-50/40 focus-visible:ring-brand-300 cursor-pointer border-gray-300 bg-gray-50/50 focus-visible:ring-2",
            )}
          >
            <div className="bg-brand-50 text-brand-700 flex h-11 w-11 items-center justify-center rounded-full shadow-2xs">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className="h-5 w-5"
              >
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <span className="text-surface-700 text-xs font-semibold sm:text-sm">
              {effectiveHelper}
            </span>
            <span className="text-surface-400 text-[11px]">
              {isKiosk
                ? "Front camera photo"
                : `JPG · PNG · WEBP · PDF — up to ${maxSizeMB}MB`}
            </span>
          </div>

          {/* Action Buttons Below Empty Dropzone */}
          <div className="mt-2.5 flex gap-2">
            {/* Take Photo Button (Always shown) */}
            <button
              type="button"
              disabled={interactionDisabled}
              onClick={() => setIsCameraModalOpen(true)}
              className={cn(
                "border-surface-300 text-brand-900 hover:bg-background-100 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white text-xs font-semibold shadow-2xs transition disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
                isKiosk ? "w-full" : "flex-1",
              )}
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

            {/* Upload from Device Button (Web only; hidden in Kiosk) */}
            {!isKiosk && (
              <button
                type="button"
                disabled={interactionDisabled}
                onClick={() => uploadInputRef.current?.click()}
                className="border-surface-300 text-brand-900 hover:bg-background-100 flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white text-xs font-semibold shadow-2xs transition disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
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
            )}
          </div>
        </div>
      )}

      {/* Field-level error message */}
      {activeError && !hasFile && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-rose-500">
          {activeError}
        </p>
      )}

      {/* Hidden file input for device picker (Web only) */}
      {!isKiosk && (
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
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(capturedFile) => handleIncoming([capturedFile])}
        isKiosk={isKiosk}
        title={cameraTitle || (label ? `Capture ${label}` : "Take Photo")}
        shapeGuide={shapeGuide}
      />
    </div>
  );
}

export default FileCaptureField;
