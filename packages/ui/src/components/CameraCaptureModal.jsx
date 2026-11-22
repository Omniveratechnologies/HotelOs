import { useEffect, useRef, useState, useCallback } from "react";
import { isKioskEnvironment } from "@hotelos/utils";

/**
 * CameraCaptureModal
 *
 * Fullscreen in-app camera modal with live viewfinder, document/portrait shape guide,
 * tactile shutter button, and camera switching (web only).
 *
 * Rules:
 * - Kiosk mode: Strictly locked to front camera (`facingMode: "user"`). No camera switch button.
 * - Web mode: Defaults to back camera for documents (or front for selfie), with camera switch button
 *   to cycle through available video input devices or toggle front/back facingMode.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible.
 * @param {() => void} props.onClose - Called when modal is dismissed.
 * @param {(file: File) => void} props.onCapture - Called with the captured File object.
 * @param {boolean} [props.isKiosk] - Explicit kiosk override (defaults to isKioskEnvironment()).
 * @param {string} [props.title] - Modal title.
 * @param {"document" | "portrait" | "none"} [props.shapeGuide] - Overlay framing guide.
 * @param {"user" | "environment"} [props.defaultFacingMode] - Initial camera facing mode.
 */
export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  isKiosk: isKioskProp,
  title = "Take Photo",
  shapeGuide = "document",
  defaultFacingMode,
}) {
  const isKiosk =
    typeof isKioskProp === "boolean" ? isKioskProp : isKioskEnvironment();
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState("");
  const [videoDevices, setVideoDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState(null);

  // Facing mode state for web; kiosk is locked to "user"
  const initialFacing = isKiosk
    ? "user"
    : defaultFacingMode || (shapeGuide === "portrait" ? "user" : "environment");
  const [facingMode, setFacingMode] = useState(initialFacing);

  // Stop any existing tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore cleanup errors
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start video stream
  const startCamera = useCallback(
    async (targetFacing, targetDeviceId) => {
      stopStream();
      setIsLoading(true);
      setCameraError("");

      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error(
            "Camera API is not supported in this browser environment.",
          );
        }

        const videoConstraints = isKiosk
          ? {
              facingMode: "user",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            }
          : targetDeviceId
            ? {
                deviceId: { exact: targetDeviceId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              }
            : {
                facingMode: targetFacing || facingMode,
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              };

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: videoConstraints,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setIsLoading(false);

        // Enumerate available video devices on web
        if (!isKiosk && navigator.mediaDevices.enumerateDevices) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const inputs = devices.filter((d) => d.kind === "videoinput");
            setVideoDevices(inputs);
          } catch {
            // enumeration not permitted or failed
          }
        }
      } catch (err) {
        setIsLoading(false);
        const name = err?.name || "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setCameraError(
            "Camera access was denied. Please allow camera access in your device / browser settings.",
          );
        } else if (
          name === "NotFoundError" ||
          name === "DevicesNotFoundError"
        ) {
          setCameraError("No camera device was detected on your system.");
        } else if (name === "NotReadableError" || name === "TrackStartError") {
          setCameraError(
            "The camera is already in use by another application.",
          );
        } else {
          setCameraError(err?.message || "Unable to access camera.");
        }
      }
    },
    [facingMode, isKiosk, stopStream],
  );

  // Initialize stream on open
  useEffect(() => {
    if (isOpen) {
      // oxlint-disable-next-line react/set-state-in-effect
      startCamera(initialFacing, null);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, initialFacing, startCamera, stopStream]);

  // Switch camera (web only)
  const handleSwitchCamera = () => {
    if (isKiosk) return; // Strict lock in kiosk

    if (videoDevices.length > 1) {
      const currentIndex = videoDevices.findIndex(
        (d) => d.deviceId === activeDeviceId,
      );
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      const nextDevice = videoDevices[nextIndex];
      setActiveDeviceId(nextDevice.deviceId);
      startCamera(undefined, nextDevice.deviceId);
    } else {
      const nextFacing = facingMode === "environment" ? "user" : "environment";
      setFacingMode(nextFacing);
      setActiveDeviceId(null);
      startCamera(nextFacing, null);
    }
  };

  // Capture photo from video feed
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw unmirrored video to preserve document readability
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const filename =
          shapeGuide === "portrait"
            ? `selfie_${Date.now()}.jpg`
            : `document_${Date.now()}.jpg`;
        const file = new File([blob], filename, { type: "image/jpeg" });

        stopStream();
        onCapture?.(file);
        onClose?.();
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleClose = () => {
    stopStream();
    onClose?.();
  };

  if (!isOpen) return null;

  const isFront = isKiosk || facingMode === "user";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-xs sm:p-5"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold tracking-wide sm:text-base">
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close camera"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden bg-black sm:aspect-16/10">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/80">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-white/20 border-t-white" />
              <span className="text-xs font-medium text-white/70">
                Starting camera...
              </span>
            </div>
          )}

          {cameraError ? (
            <div className="z-20 flex max-w-xs flex-col items-center gap-3 p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-6 w-6"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="text-xs leading-relaxed font-medium text-rose-300">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => startCamera(facingMode, activeDeviceId)}
                className="mt-1 cursor-pointer rounded-lg bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                Retry Camera
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${isFront ? "scale-x-[-1]" : ""}`}
            />
          )}

          {/* Framing Guides */}
          {!cameraError && !isLoading && (
            <>
              {shapeGuide === "document" && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-8 top-6 bottom-6 rounded-2xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
                >
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 h-4 w-4 border-t-4 border-l-4 border-emerald-400" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 border-t-4 border-r-4 border-emerald-400" />
                  <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-4 border-l-4 border-emerald-400" />
                  <div className="absolute -right-1 -bottom-1 h-4 w-4 border-r-4 border-b-4 border-emerald-400" />
                  <div className="absolute inset-x-0 bottom-2 text-center">
                    <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white/90">
                      Align document inside the frame
                    </span>
                  </div>
                </div>
              )}

              {shapeGuide === "portrait" && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-12 top-6 bottom-6 rounded-[50%] border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
                >
                  <div className="absolute inset-x-0 bottom-2 text-center">
                    <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white/90">
                      Center your face in the oval
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer / Control Bar */}
        <div className="flex items-center justify-between border-t border-white/10 bg-slate-900/90 px-6 py-4">
          {/* Cancel button */}
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer text-xs font-semibold text-white/70 transition hover:text-white"
          >
            Cancel
          </button>

          {/* Shutter Capture Button */}
          <button
            type="button"
            onClick={handleCapture}
            disabled={isLoading || Boolean(cameraError)}
            aria-label="Capture photo"
            className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-white/20 shadow-lg transition hover:bg-white/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div className="h-11 w-11 rounded-full bg-white shadow-xs" />
          </button>

          {/* Switch Camera Button (Web only; strictly locked to front on kiosk) */}
          {!isKiosk ? (
            <button
              type="button"
              onClick={handleSwitchCamera}
              disabled={isLoading || Boolean(cameraError)}
              aria-label="Switch camera"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/90 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
              title="Switch camera"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
                <path d="m15 15 3-3-3-3" />
                <path d="m9 9-3 3 3 3" />
              </svg>
            </button>
          ) : (
            <div className="w-9" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
}

export default CameraCaptureModal;
