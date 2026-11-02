import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { FiCamera } from "react-icons/fi";

const MAX_WIDTH = 1280;

const localChecks = (video) => {
  const w = 160;
  const h = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * w));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const gray = new Float32Array(w * h);
  let sum = 0;
  for (let i = 0; i < w * h; i += 1) {
    gray[i] =
      0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    sum += gray[i];
  }
  const brightness = sum / (w * h);

  // sharpness = variance of a simple Laplacian
  let mean = 0,
    count = 0;
  const lap = [];
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x;
      const v =
        4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
      lap.push(v);
      mean += v;
      count += 1;
    }
  }
  mean /= count || 1;
  const sharpness = lap.reduce((s, v) => s + (v - mean) ** 2, 0) / (count || 1);

  const issues = [];
  if (brightness < 40) issues.push("Too dark. Move to a brighter place.");
  else if (brightness > 220)
    issues.push("Too bright. Avoid light behind or on your face.");
  if (sharpness < 4)
    issues.push("Image is blurry. Hold still and clean the camera lens.");
  return issues;
};

const errorText = (error) => {
  if (!navigator.mediaDevices?.getUserMedia)
    return "The camera needs a secure page (https or localhost). Upload a photo instead.";
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError")
    return "Camera access is blocked. Allow it in the browser address bar, or upload a photo.";
  if (error?.name === "NotFoundError" || error?.name === "OverconstrainedError")
    return "No camera found. Connect one, or upload a photo.";
  if (error?.name === "NotReadableError")
    return "The camera is being used by another app.";
  return "Could not start the camera.";
};

const FaceCamera = forwardRef(
  ({ enabled, message, tone = "info", onReadyChange }, ref) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState("");

    const stop = useCallback(() => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setReady(false);
    }, []);

    useEffect(() => {
      onReadyChange?.(ready);
    }, [ready, onReadyChange]);

    useEffect(() => {
      if (!enabled) {
        stop();
        setError("");
        return undefined;
      }
      let cancelled = false;
      (async () => {
        try {
          if (!navigator.mediaDevices?.getUserMedia)
            throw new Error("no-media");
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          const video = videoRef.current;
          video.srcObject = stream;
          await video.play().catch(() => {});
          setError("");
          setReady(true);
        } catch (e) {
          if (!cancelled) setError(errorText(e));
        }
      })();
      return () => {
        cancelled = true;
        stop();
      };
    }, [enabled, stop]);

    useImperativeHandle(ref, () => ({
      capture: () =>
        new Promise((resolve, reject) => {
          const video = videoRef.current;
          if (!video || !video.videoWidth)
            return reject(new Error("The camera is not ready yet."));
          const issues = localChecks(video);
          const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          canvas
            .getContext("2d")
            .drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toBlob(
            (blob) =>
              blob
                ? resolve({ blob, issues })
                : reject(new Error("Could not take the photo.")),
            "image/jpeg",
            0.9,
          );
        }),
    }));

    const bar =
      tone === "error"
        ? "bg-red-600/90"
        : tone === "ok"
          ? "bg-emerald-600/90"
          : "bg-black/65";

    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-gray-700 bg-black">
        <video
          ref={videoRef}
          muted
          playsInline
          aria-label="Camera preview"
          className={`h-full w-full [transform:scaleX(-1)] object-cover ${ready ? "" : "invisible"}`}
        />

        {!enabled && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-xs text-gray-500">
            <FiCamera size={26} />
            Select a staff member to start the camera.
          </div>
        )}
        {enabled && !ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
            Starting camera...
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-red-300"
          >
            {error}
          </div>
        )}

        {ready && (
          <>
            {/* face frame guide */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-[18%_26%]"
            >
              <span className="absolute top-0 left-0 h-6 w-6 rounded-tl-lg border-t-2 border-l-2 border-emerald-400" />
              <span className="absolute top-0 right-0 h-6 w-6 rounded-tr-lg border-t-2 border-r-2 border-emerald-400" />
              <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-emerald-400" />
              <span className="absolute right-0 bottom-0 h-6 w-6 rounded-br-lg border-r-2 border-b-2 border-emerald-400" />
            </div>
            <p
              role="status"
              className={`absolute inset-x-0 bottom-0 px-3 py-1.5 text-center text-[11px] font-medium text-white ${bar}`}
            >
              {message || "Position your face within the frame"}
            </p>
          </>
        )}
      </div>
    );
  },
);

FaceCamera.displayName = "FaceCamera";
export default FaceCamera;
