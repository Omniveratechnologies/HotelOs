import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, RefreshCcw } from "lucide-react";

const TIPS = ["Look at the camera", "Good lighting", "No mask or sunglasses"];

/**
 * Step 5 — Take Photo: live camera preview with face guide + capture; falls
 * back to device upload when no camera. Captures JPEG via canvas (quality 0.85).
 */
export function PhotoStep({ selfie, onCapture, uploading = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraState, setCameraState] = useState("idle"); // idle | on | error

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraState("on");
    } catch {
      setCameraState("error");
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCameraState("idle");
        onCapture(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.85,
    );
  };

  return (
    <div>
      <p className="text-brand-900 text-center text-lg font-semibold">
        Take Your Photo
      </p>
      <p className="text-surface-500 mt-1 text-center text-sm">
        Look at the camera and capture your photo
      </p>

      <div className="mt-5 space-y-4">
        {/* Preview / captured image */}
        <div className="relative mx-auto w-full max-w-xs">
          <div className="bg-brand-950 aspect-3/4 overflow-hidden rounded-2xl">
            {selfie ? (
              <img
                src={selfie.previewUrl || selfie.url}
                alt="Captured selfie"
                className="h-full w-full object-cover"
              />
            ) : cameraState === "on" ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full scale-x-[-1] object-cover"
              />
            ) : (
              <div className="text-surface-300 flex h-full flex-col items-center justify-center gap-2 text-sm">
                <Camera size={32} />
                {cameraState === "error"
                  ? "Camera not available — use upload below"
                  : "Camera will appear here"}
              </div>
            )}
            {cameraState === "on" && !selfie && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 top-8 bottom-14 rounded-[50%] border-2 border-white/70"
              />
            )}
          </div>

          {cameraState === "on" && !selfie && (
            <button
              type="button"
              onClick={capture}
              disabled={uploading}
              aria-label="Capture photo"
              className="bg-brand-700 hover:bg-brand-800 absolute bottom-3 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full text-white shadow-lg transition disabled:opacity-50"
            >
              <Camera size={22} />
            </button>
          )}
        </div>

        <ul className="space-y-1.5">
          {TIPS.map((tip) => (
            <li
              key={tip}
              className="text-surface-600 flex items-center gap-2 text-xs"
            >
              <CheckCircle2 size={13} className="text-emerald-600" /> {tip}
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          {!selfie && cameraState !== "on" && (
            <button
              type="button"
              onClick={startCamera}
              className="border-surface-300 text-brand-900 hover:bg-background-100 flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border bg-white text-sm font-medium"
            >
              <Camera size={16} /> Use Camera
            </button>
          )}
          {selfie ? (
            <>
              <button
                type="button"
                onClick={startCamera}
                disabled={uploading}
                className="border-surface-300 text-brand-900 hover:bg-background-100 flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border bg-white text-sm font-medium disabled:opacity-50"
              >
                <RefreshCcw size={15} /> Retake
              </button>
            </>
          ) : cameraState !== "on" ? (
            <label className="border-surface-300 text-brand-900 hover:bg-background-100 flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border bg-white text-sm font-medium">
              Upload photo
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                disabled={uploading}
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
