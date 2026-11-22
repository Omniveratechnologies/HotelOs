import { useCallback, useEffect, useRef, useState } from "react";
import { FiCamera, FiPlus, FiUpload, FiX } from "react-icons/fi";

import ActionButton from "../ui/button/ActionButton.jsx";
import FaceCamera from "./FaceCamera.jsx";
import FaceStaffSelect from "./FaceStaffSelect.jsx";
import { upload } from "../../utils/faceUtils.js";

const INSTRUCTIONS = [
  "Ensure good lighting.",
  "Look straight into the camera.",
  "Keep a neutral expression.",
  "Capture 3–5 different angles.",
];

const RegisterFacePanel = ({
  staff,
  rules,
  onStaffChange,
  onSaved,
  notify,
}) => {
  const min = rules?.minImages ?? 3;
  const max = rules?.maxImages ?? 5;

  const camera = useRef(null);
  const fileInput = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [hint, setHint] = useState({ text: "", tone: "info" });
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const photosRef = useRef(photos);
  photosRef.current = photos;

  const releaseAll = useCallback(
    () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)),
    [],
  );

  useEffect(() => {
    releaseAll();
    setPhotos([]);
    setHint({ text: "", tone: "info" });
    setConsent(false);
    setError("");
  }, [staff?._id, releaseAll]);

  useEffect(() => releaseAll, [releaseAll]);

  const addPhoto = async (blob, localIssues = []) => {
    if (localIssues.length)
      return setHint({ text: localIssues[0], tone: "error" });

    const form = new FormData();
    form.append("image", blob, "frame.jpg");
    const res = await upload("/check", form);
    if (!res.data.ok)
      return setHint({
        text: res.data.issues[0] || "This photo can't be used.",
        tone: "error",
      });

    setPhotos((list) => [
      ...list,
      {
        id: `${Date.now()}-${list.length}`,
        blob,
        url: URL.createObjectURL(blob),
        angle: res.data.angle,
      },
    ]);
    return setHint({
      text: "Photo captured. Turn your head slightly for the next one.",
      tone: "ok",
    });
  };

  const guarded = async (job) => {
    setBusy(true);
    setError("");
    try {
      await job();
    } catch (e) {
      setHint({ text: e.message, tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const capture = () =>
    guarded(async () => {
      const { blob, issues } = await camera.current.capture();
      await addPhoto(blob, issues);
    });

  const onFiles = (event) => {
    const files = [...event.target.files].slice(0, max - photos.length);
    event.target.value = "";
    guarded(async () => {
      for (const file of files) await addPhoto(file);
    });
  };

  const removePhoto = (id) =>
    setPhotos((list) => {
      const gone = list.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return list.filter((p) => p.id !== id);
    });

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const form = new FormData();
      form.append("staffId", staff._id);
      form.append("consent", consent ? "true" : "false");
      const seen = new Set();
      form.append(
        "angles",
        JSON.stringify(
          photos.map((p) =>
            seen.has(p.angle) ? null : (seen.add(p.angle), p.angle),
          ),
        ),
      );
      photos.forEach((p, i) =>
        form.append("images", p.blob, `photo-${i + 1}.jpg`),
      );

      const res = await upload("/enroll", form);
      releaseAll();
      setPhotos([]);
      setConsent(false);
      onSaved(res.message || "Face saved.", res.data);
    } catch (e) {
      setError(e.message);
      notify?.(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const enough = photos.length >= min;
  const full = photos.length >= max;
  const needConsent = rules?.consentRequired !== false;
  const canSave = staff && enough && (!needConsent || consent) && !saving;
  const updating =
    staff?.faceStatus === "REGISTERED" || staff?.action === "UPDATE";

  return (
    <section
      aria-label="Register new face"
      className="rounded-lg border border-gray-800 p-4"
    >
      <h2 className="mb-3 text-sm font-semibold text-white">
        {updating ? "Update Face" : "Register New Face"}
      </h2>

      <label className="mb-1.5 block text-[11px] font-medium text-gray-400">
        Select Staff <span className="text-red-400">*</span>
      </label>
      <FaceStaffSelect
        value={staff}
        onChange={onStaffChange}
        disabled={saving}
      />

      <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
        <p className="mb-1 text-[11px] font-semibold text-gray-200">
          Instructions
        </p>
        <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-gray-400">
          {INSTRUCTIONS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="mt-3">
        <FaceCamera
          ref={camera}
          enabled={Boolean(staff)}
          message={hint.text}
          tone={hint.tone}
          onReadyChange={setCameraReady}
        />
      </div>

      <ActionButton
        onClick={capture}
        disabled={!staff || !cameraReady || busy || full || saving}
        icon={<FiCamera size={14} />}
        className="mt-3 w-full justify-center"
      >
        {busy
          ? "Checking..."
          : full
            ? "Maximum photos reached"
            : "Capture Face"}
      </ActionButton>

      <div
        className="mt-3 flex flex-wrap items-center gap-2"
        aria-label="Captured photos"
      >
        {photos.map((photo, i) => (
          <div key={photo.id} className="relative">
            <img
              src={photo.url}
              alt={`Captured photo ${i + 1}`}
              className="h-14 w-14 rounded-md border border-gray-700 object-cover"
            />
            {!saving && (
              <button
                type="button"
                aria-label={`Remove photo ${i + 1}`}
                onClick={() => removePhoto(photo.id)}
                className="absolute -top-1.5 -right-1.5 rounded-full bg-gray-900 p-0.5 text-gray-300 ring-1 ring-gray-600 hover:text-white"
              >
                <FiX size={11} />
              </button>
            )}
          </div>
        ))}
        {!full && (
          <button
            type="button"
            aria-label="Add another photo"
            onClick={capture}
            disabled={!staff || !cameraReady || busy || saving}
            className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-gray-600 text-gray-500 hover:text-white disabled:opacity-40"
          >
            <FiPlus size={18} />
          </button>
        )}
      </div>

      <p className="mt-2 text-[11px] text-gray-500">
        {photos.length} of {min}–{max} photos
        {!enough && photos.length > 0
          ? ` · ${min - photos.length} more needed`
          : ""}
      </p>

      <div className="mt-2">
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={onFiles}
          aria-label="Upload photos"
        />
        <button
          type="button"
          disabled={!staff || busy || full || saving}
          onClick={() => fileInput.current?.click()}
          className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 underline-offset-2 hover:text-white hover:underline disabled:opacity-40"
        >
          <FiUpload size={12} /> No camera? Upload photos instead
        </button>
      </div>

      {needConsent && (
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-[11px] text-gray-300">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={!staff || saving}
            aria-label="Staff consent"
            className="mt-0.5 h-4 w-4 accent-emerald-500"
          />
          <span>
            The staff member agrees to have their face stored for attendance.
            Face data is encrypted and deleted after they leave.
          </span>
        </label>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300"
        >
          {error}
        </p>
      )}

      <ActionButton
        onClick={save}
        disabled={!canSave}
        className="mt-3 w-full justify-center"
      >
        {saving ? "Saving..." : updating ? "Update Face" : "Register Face"}
      </ActionButton>
    </section>
  );
};

export default RegisterFacePanel;
