import { useState, useEffect, useRef } from "react";
import { ScanFace, X } from "lucide-react";
import Button from "../ui/button/Button";

const RegisterFaceModal = ({ open, staffId, onClose, onSubmit, loading }) => {
  const [embeddingRef, setEmbeddingRef] = useState("");
  const [error, setError] = useState("");
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    let active = true;
    let mediaStream;

    const startCamera = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!active) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        setStream(mediaStream);
        setCameraError("");
      } catch {
        if (active) {
          setCameraError(
            "Camera access failed. Allow camera permission and try again.",
          );
        }
      }
    };

    startCamera();

    return () => {
      active = false;
      mediaStream?.getTracks().forEach((track) => track.stop());
      setStream((currentStream) => {
        currentStream?.getTracks().forEach((track) => track.stop());
        return null;
      });
    };
  }, [open]);

  useEffect(() => {
    if (!videoRef.current || !stream) return;

    videoRef.current.srcObject = stream;

    videoRef.current.play().catch(() => {
      setCameraError("Could not start the camera preview.");
    });
  }, [stream]);

  const submit = async (event) => {
    event.preventDefault();

    if (!embeddingRef.trim()) {
      setError("Enter a valid reference from your face-recognition system.");
      return;
    }

    setError("");

    try {
      await onSubmit(embeddingRef.trim());
      setEmbeddingRef("");
    } catch (err) {
      setError(err.message || "Face registration failed.");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-face-title"
        className="w-full max-w-md rounded-xl border border-gray-800 bg-[#151515] p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScanFace className="text-emerald-400" />
            <h2 id="register-face-title" className="font-semibold">
              Register Face
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-gray-400 hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            aria-label="Close face registration"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-400">
          Staff ID: <span className="text-gray-200">{staffId}</span>
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              className="mb-2 block text-xs text-gray-300"
              htmlFor="embeddingRef"
            >
              Face embedding reference
            </label>

            <input
              id="embeddingRef"
              value={embeddingRef}
              onChange={(event) => setEmbeddingRef(event.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              placeholder="Reference returned by your face provider"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-400">
              {error}
            </p>
          )}

          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full rounded-lg bg-black object-cover"
          />

          {cameraError && (
            <p role="alert" className="text-sm text-red-400">
              {cameraError}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register Face"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default RegisterFaceModal;
