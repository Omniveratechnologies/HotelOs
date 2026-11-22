import {
  CircleCheck,
  Info,
  ScanFace,
  Camera,
  LoaderCircle,
} from "lucide-react";
import AddStaffCard from "./AddStaffCard.jsx";
import Button from "../ui/button/Button.jsx";

const instructions = [
  "Ensure good lighting",
  "Look directly at the camera",
  "Remove sunglasses or mask",
  "Capture multiple angles for better recognition",
];

const FaceRegistration = ({
  faceStatus,
  isSaved = false,
  loading = false,
  disabled = false,
  onRegister,
}) => {
  const registered = faceStatus === "REGISTERED";

  return (
    <AddStaffCard title="Face Registration" icon={ScanFace}>
      <div className="space-y-4">
        <div className="flex gap-3 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-200">
          <Info
            size={18}
            className="mt-0.5 shrink-0 text-sky-400"
            aria-hidden="true"
          />
          <p>
            {isSaved
              ? "Click Register Face to capture and store the staff's face for attendance."
              : "After saving basic details, click on Register Face to capture and store the staff's face for attendance."}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-700 p-5">
          <ScanFace
            size={48}
            strokeWidth={1.25}
            className={registered ? "text-emerald-400" : "text-gray-500"}
            aria-hidden="true"
          />

          <p
            role="status"
            className={`flex items-center gap-2 text-xs ${
              registered ? "text-emerald-400" : "text-gray-400"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                registered ? "bg-emerald-400" : "bg-gray-500"
              }`}
              aria-hidden="true"
            />
            {registered ? "Face Registered" : "Face Not Registered"}
          </p>

          <Button
            type="button"
            variant={registered ? "secondary" : "primary"}
            onClick={onRegister}
            disabled={disabled || loading}
            className="w-full justify-center sm:w-3/4"
          >
            {loading ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Camera size={16} />
            )}
            {registered ? "Update Face" : "Register Face"}
          </Button>

          {!isSaved && (
            <p className="text-center text-[11px] text-gray-500">
              The staff details are saved first, then the camera opens.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-300">
            <CircleCheck size={14} aria-hidden="true" />
            Instructions:
          </p>

          <ul className="list-disc space-y-1 pl-6 text-xs text-gray-300">
            {instructions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </AddStaffCard>
  );
};

export default FaceRegistration;
