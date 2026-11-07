import { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  CheckCircle2,
  RefreshCcw,
  SwitchCamera,
  AlertCircle,
} from "lucide-react";
import type { FileRef } from "../../types/checkIn.types";

const TIPS = ["Look at the camera", "Good lighting", "No mask or sunglasses"];

interface PhotoStepProps {
  selfie:
    | (FileRef & {
        previewUrl?: string;
        file?: File;
        isUploading?: boolean;
        error?: string;
      })
    | null;
  onCapture: (file: File) => void;
  uploading?: boolean;
  error?: string;
  isKiosk?: boolean;
  onRetry?: () => void;
}

export function PhotoStep({
  selfie,
  onCapture,
  uploading = false,
  error,
  isKiosk = false,
  onRetry,
}: PhotoStepProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<"idle" | "on" | "error">(
    "idle",
  );
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState("");

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async (targetFacing?: "user" | "environment") => {
    stopCamera();
    setCameraError("");
    const effectiveFacing = isKiosk ? "user" : targetFacing || facingMode;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: effectiveFacing,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraState("on");
    } catch (err: unknown) {
      setCameraState("error");
      const msg =
        err instanceof Error ? err.message : "Unable to access camera";
      setCameraError(msg);
    }
  };

  const switchCamera = () => {
    if (isKiosk) return; // Strict lock in kiosk
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamera();
        setCameraState("idle");
        onCapture(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  };

  const isUploading = uploading || Boolean(selfie?.isUploading);
  const activeError = selfie?.error || error;
  const isFront = isKiosk || facingMode === "user";

  return (
    <div>
      <p className="text-brand-900 text-center text-lg font-semibold">
        Take Your Photo
      </p>
      <p className="text-surface-500 mt-1 text-center text-sm">
        Look at the camera and capture your photo
      </p>

      <div className="mt-5 space-y-4">
        {/* Preview / Captured image / Live Viewfinder */}
        <div className="relative mx-auto w-full max-w-xs">
          <div className="bg-brand-950 relative aspect-3/4 overflow-hidden rounded-2xl border border-gray-200 shadow-xs">
            {selfie?.previewUrl || selfie?.url ? (
              <div className="relative h-full w-full">
                <img
                  src={selfie.previewUrl || selfie.url}
                  alt="Captured selfie"
                  className="h-full w-full object-cover"
                />

                {/* Uploading Spinner */}
                {isUploading && (
                  <div className="backdrop-blur-2xs absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-white">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-white/20 border-t-white" />
                    <span className="text-xs font-semibold">
                      Uploading photo...
                    </span>
                  </div>
                )}
              </div>
            ) : cameraState === "on" ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${isFront ? "scale-x-[-1]" : ""}`}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-8 top-8 bottom-16 rounded-[50%] border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]"
                />

                {/* Shutter Button */}
                <button
                  type="button"
                  onClick={capture}
                  disabled={isUploading}
                  aria-label="Capture photo"
                  className="bg-brand-700 hover:bg-brand-800 absolute bottom-3 left-1/2 flex h-14 w-14 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full text-white shadow-xl transition active:scale-95 disabled:opacity-50"
                >
                  <Camera size={24} />
                </button>

                {/* Camera Switcher (Web only) */}
                {!isKiosk && (
                  <button
                    type="button"
                    onClick={switchCamera}
                    aria-label="Switch camera"
                    className="absolute top-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-xs transition hover:bg-black/70"
                  >
                    <SwitchCamera size={18} />
                  </button>
                )}
              </>
            ) : (
              <div className="text-surface-300 flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm">
                <Camera size={36} className="text-surface-400" />
                {cameraState === "error"
                  ? cameraError || "Camera not available — use upload below"
                  : "Camera will appear here"}
              </div>
            )}
          </div>
        </div>

        {/* Inline Error Message */}
        {activeError && (
          <div className="mx-auto flex max-w-xs items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-600">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={16} className="shrink-0" />
              <span>{activeError}</span>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="cursor-pointer rounded-md bg-rose-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-rose-700"
              >
                Retry
              </button>
            )}
          </div>
        )}

        <ul className="mx-auto max-w-xs space-y-1.5">
          {TIPS.map((tip) => (
            <li
              key={tip}
              className="text-surface-600 flex items-center gap-2 text-xs"
            >
              <CheckCircle2 size={13} className="text-emerald-600" /> {tip}
            </li>
          ))}
        </ul>

        {/* Action Controls */}
        <div className="mx-auto flex max-w-xs gap-2">
          {!selfie && cameraState !== "on" && (
            <button
              type="button"
              onClick={() => startCamera()}
              className="border-surface-300 text-brand-900 hover:bg-background-100 flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white text-sm font-semibold shadow-2xs"
            >
              <Camera size={16} /> Use Camera
            </button>
          )}

          {selfie ? (
            <button
              type="button"
              onClick={() => startCamera()}
              disabled={isUploading}
              className="border-surface-300 text-brand-900 hover:bg-background-100 flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white text-sm font-semibold shadow-2xs disabled:opacity-50"
            >
              <RefreshCcw size={15} /> Retake Photo
            </button>
          ) : cameraState !== "on" && !isKiosk ? (
            <label className="border-surface-300 text-brand-900 hover:bg-background-100 flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white text-sm font-semibold shadow-2xs">
              Upload photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onCapture(f);
                  e.target.value = "";
                }}
              />
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default PhotoStep;
