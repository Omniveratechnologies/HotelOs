import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import Button from "../ui/button/Button.jsx";
import AddStaffCard from "./AddStaffCard.jsx";

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const StaffPhoto = ({ file, setFile, initialPhotoUrl = "" }) => {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(initialPhotoUrl);

  useEffect(() => {
    if (!file) {
      setPreview(initialPhotoUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file, initialPhotoUrl]);

  const selectFile = (event) => {
    const selected = event.target.files?.[0];
    event.target.value = "";

    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Choose a JPG, PNG, or WEBP image.");
      return;
    }

    if (selected.size > MAX_SIZE) {
      setError("Photo must be 2 MB or smaller.");
      return;
    }

    setError("");
    setFile(selected);
  };

  const removeFile = () => {
    setFile(null);
    setError("");
  };

  return (
    <AddStaffCard
      title="Staff Photo"
      subtitle="Upload a clear photo of the staff member."
      icon={Camera}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-700 bg-[#0f0f0f]">
          {preview ? (
            <img
              src={preview}
              alt="Staff photo preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus size={30} className="text-gray-600" />
          )}
        </div>

        <div className="space-y-2 text-center sm:text-left">
          <p className="text-sm text-gray-200">Profile photo</p>
          <p className="text-xs text-gray-500">
            JPG, PNG, or WEBP · Maximum 2 MB
          </p>

          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button onClick={() => inputRef.current?.click()}>
              Choose Photo
            </Button>

            {file && (
              <Button variant="secondary" onClick={removeFile}>
                <X size={14} /> Remove
              </Button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={selectFile}
            className="sr-only"
            aria-label="Choose staff photo"
          />

          {error && (
            <p role="alert" className="text-xs text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    </AddStaffCard>
  );
};

export default StaffPhoto;
