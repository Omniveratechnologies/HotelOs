import Modal from "../../../components/ui/Modal.jsx";
import Button from "../../../components/ui/Button.jsx";

const avatarColors = [
  "bg-brand-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
];

export default function GuestDetailsModal({
  open,
  onClose,
  guest,
  onEdit,
  onManageCredentials,
}) {
  if (!open || !guest) return null;

  const colorIndex =
    Math.abs(
      (guest.name || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0),
    ) % avatarColors.length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Guest Profile"
      subtitle={`Account ID: ${guest.id}`}
    >
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-xs ${avatarColors[colorIndex]}`}
          >
            {guest.name ? guest.name[0].toUpperCase() : "G"}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-brand-900 truncate text-base font-bold">
              {guest.name}
            </h3>
            <p className="truncate text-xs text-gray-500">
              {guest.email || "No email"}
            </p>
            <p className="text-xs text-gray-500">{guest.phone || "No phone"}</p>
          </div>
          <div>
            <span
              className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
                guest.status === "checked-in"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : guest.status === "reserved"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-gray-200 bg-gray-100 text-gray-700"
              }`}
            >
              {guest.status || "Registered"}
            </span>
          </div>
        </div>

        {/* Identity & Verification */}
        <div className="rounded-xl border border-gray-100 p-4">
          <h4 className="text-brand-900 mb-3 text-sm font-semibold">
            Government Identity Verification
          </h4>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-xs text-gray-500">ID Document Type</span>
              <p className="font-medium text-gray-800">
                {guest.idType || "Aadhaar"}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">ID Document Number</span>
              <p className="font-mono font-medium text-gray-800">
                {guest.idNumber || "Not recorded"}
              </p>
            </div>
            {guest.address && (
              <div className="sm:col-span-2">
                <span className="text-xs text-gray-500">
                  Residential Address
                </span>
                <p className="font-medium text-gray-800">{guest.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Stay / Room */}
        <div className="rounded-xl border border-gray-100 p-4">
          <h4 className="text-brand-900 mb-3 text-sm font-semibold">
            Current Stay Assignment
          </h4>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <span className="text-xs text-gray-500">Assigned Room</span>
              <p className="text-brand-900 font-bold">
                {guest.room ? `Room ${guest.room}` : "No active room"}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Check In</span>
              <p className="font-medium text-gray-800">
                {guest.checkIn || "—"}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Check Out</span>
              <p className="font-medium text-gray-800">
                {guest.checkOut || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Uploaded Documents */}
        <div className="rounded-xl border border-gray-100 p-4">
          <h4 className="text-brand-900 mb-3 text-sm font-semibold">
            Verified Documents ({guest.documents?.length || 0})
          </h4>
          {guest.documents?.length > 0 ? (
            <div className="space-y-2">
              {guest.documents.map((doc, idx) => (
                <div
                  key={doc.id || idx}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs"
                >
                  <span className="truncate font-medium text-gray-700">
                    📄 {doc.filename || `Document ${idx + 1}`}
                    {doc.docType ? ` (${doc.docType})` : ""}
                  </span>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-600 font-semibold"
                    >
                      View / Download
                    </a>
                  ) : (
                    <span className="text-gray-400">Stored</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              No documents on file for this guest.
            </p>
          )}
        </div>

        {/* Portal Access */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div>
            <span className="text-xs text-gray-500">Guest Portal Username</span>
            <div className="text-brand-900 font-mono text-sm font-bold">
              {guest.username || "—"}
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              onManageCredentials?.(guest);
              onClose();
            }}
          >
            Manage Portal Password
          </Button>
        </div>

        {/* Footer actions */}
        <div className="flex justify-between border-t border-gray-100 pt-4">
          <Button
            variant="primary"
            onClick={() => {
              onEdit?.(guest);
              onClose();
            }}
          >
            Edit Profile
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
