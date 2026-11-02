import { useEffect, useState } from "react";
import { FiEdit2 } from "react-icons/fi";

import Modal from "../ui/Modal.jsx";
import API_BASE_URL from "../../config/api";

const dateText = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
};

const label = (value) =>
  value
    ? String(value)
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase())
    : "-";

const Field = ({ title, children }) => (
  <div className="min-w-0">
    <p className="text-[10px] tracking-wide text-gray-500 uppercase">{title}</p>
    <p className="mt-0.5 text-xs break-words text-gray-200">
      {children || "-"}
    </p>
  </div>
);

const Pill = ({ tone, children }) => (
  <span
    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
      tone === "good"
        ? "bg-emerald-500/15 text-emerald-400"
        : "bg-gray-700/60 text-gray-300"
    }`}
  >
    {children}
  </span>
);

const StaffViewModal = ({ open, staffId, onClose, onEdit }) => {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open || !staffId) return undefined;

    const controller = new AbortController();
    setLoading(true);
    setError("");
    setStaff(null);
    setPhotoFailed(false);

    fetch(`${API_BASE_URL}/v1/staffManagement/${staffId}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false)
          throw new Error(json.message || "Could not load this staff member.");
        setStaff(json.data);
      })
      .catch((err) => err.name !== "AbortError" && setError(err.message))
      .finally(() => !controller.signal.aborted && setLoading(false));

    return () => controller.abort();
  }, [open, staffId, retry]);

  const initials = (staff?.name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Staff Details"
      maxWidth="max-w-xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800"
          >
            Close
          </button>
          {onEdit && staff && (
            <button
              type="button"
              onClick={() => onEdit(staff._id)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-black hover:bg-emerald-400"
            >
              <FiEdit2 size={12} /> Edit
            </button>
          )}
        </>
      }
    >
      {loading && (
        <p className="py-10 text-center text-xs text-gray-500">Loading...</p>
      )}

      {error && !loading && (
        <div className="py-8 text-center">
          <p className="text-xs text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => setRetry((n) => n + 1)}
            className="mt-3 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      )}

      {staff && !loading && (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            {staff.photoUrl && !photoFailed ? (
              <img
                src={staff.photoUrl}
                alt={staff.name}
                onError={() => setPhotoFailed(true)}
                className="h-16 w-16 shrink-0 rounded-full border border-gray-700 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-lg font-semibold text-emerald-400">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-white">
                {staff.name}
              </h3>
              <p className="text-xs text-gray-400">{staff.staffCode}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Pill tone={staff.status === "ACTIVE" ? "good" : "muted"}>
                  {label(staff.status)}
                </Pill>
                <Pill
                  tone={staff.faceStatus === "REGISTERED" ? "good" : "muted"}
                >
                  {staff.faceStatus === "REGISTERED"
                    ? "Face registered"
                    : "Face not registered"}
                </Pill>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field title="Phone">{staff.phone}</Field>
            <Field title="Email">{staff.email}</Field>
            <Field title="Department">{staff.department}</Field>
            <Field title="Designation">{staff.designation}</Field>
            <Field title="Employment type">{label(staff.employmentType)}</Field>
            <Field title="Joined on">{dateText(staff.joinedOn)}</Field>
            <Field title="Date of birth">{dateText(staff.dob)}</Field>
            <Field title="Address">{staff.address}</Field>
          </div>

          {staff.notes && <Field title="Notes">{staff.notes}</Field>}
        </div>
      )}
    </Modal>
  );
};

export default StaffViewModal;
