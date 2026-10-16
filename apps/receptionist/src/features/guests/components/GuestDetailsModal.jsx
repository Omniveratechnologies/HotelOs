import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Button, InlineBanner } from "@hotelos/ui/components";
import { formatCurrency } from "@hotelos/utils";
import {
  updateGuestCredentials,
  softDeleteGuest,
  restoreGuest,
} from "@hotelos/api";
import {
  X,
  Phone,
  Mail,
  Calendar,
  Key,
  Copy,
  Check,
  Edit2,
  Trash2,
  RotateCcw,
  Plus,
  Crown,
  FileText,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export default function GuestDetailsModal({
  guest,
  onClose,
  onEdit,
  onRefresh,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'stays'
  const [selectedStay, setSelectedStay] = useState(null);

  // Credential regeneration state
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState(null); // { message, variant }
  const [generatedCreds, setGeneratedCreds] = useState(null);
  const [copied, setCopied] = useState(false);

  // Soft delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!guest) return null;

  const guestId = guest.id || guest._id || guest.guestId;
  const stays = guest.stays || [];
  const isRepeat = (guest.totalStays || stays.length) >= 2;

  const handleRegenerateCredentials = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await updateGuestCredentials(guestId, {
        action: "regenerate",
      });
      const creds = res?.data || res;
      setGeneratedCreds(creds);
      setBanner({
        message: creds.emailSent
          ? `New credentials generated and dispatched to ${guest.email}!`
          : "New credentials generated. Email not configured or failed to deliver.",
        variant: creds.emailSent ? "success" : "warning",
      });
    } catch (err) {
      setBanner({
        message: err?.message || "Failed to regenerate credentials",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSoftDelete = async () => {
    setBusy(true);
    setBanner(null);
    try {
      await softDeleteGuest(guestId);
      setBanner({
        message: `Guest account for "${guest.name}" has been soft-deleted.`,
        variant: "success",
      });
      setShowDeleteConfirm(false);
      onRefresh?.();
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setBanner({
        message: err?.message || "Failed to delete guest",
        variant: "error",
      });
      setShowDeleteConfirm(false);
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    setBanner(null);
    try {
      await restoreGuest(guestId);
      setBanner({
        message: `Guest account for "${guest.name}" has been reactivated.`,
        variant: "success",
      });
      onRefresh?.();
    } catch (err) {
      setBanner({
        message: err?.message || "Failed to restore guest",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleNewReservation = () => {
    const params = new URLSearchParams();
    params.set("guestId", guestId);
    if (guest.phone) params.set("phone", guest.phone);
    onClose();
    navigate(`/reservations/repeat/new?${params.toString()}`);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative my-6 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Bar */}
        <div className="bg-brand-900 flex shrink-0 items-center justify-between px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg font-bold text-white">
              {(guest.name ? guest.name.slice(0, 2) : "GU").toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{guest.name}</h3>
                {guest.isActive === false ? (
                  <span className="rounded-full border border-rose-500/30 bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                    Soft Deleted
                  </span>
                ) : (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    Active Profile
                  </span>
                )}
                {isRepeat && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    <Crown className="h-3 w-3" /> Repeat Guest
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-white/60">
                Username: @{guest.username || "guest"} ·{" "}
                {guest.totalStays || stays.length} Total Stays
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-6 py-3">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              icon={Edit2}
              onClick={() => onEdit && onEdit(guest)}
              className="text-xs"
            >
              Edit Profile
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleNewReservation}
              className="text-xs"
            >
              New Reservation
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Key}
              onClick={handleRegenerateCredentials}
              disabled={busy}
              className="text-xs"
            >
              Reset Credentials
            </Button>
          </div>

          <div>
            {guest.isActive === false ? (
              <Button
                variant="outline"
                size="sm"
                icon={RotateCcw}
                onClick={handleRestore}
                disabled={busy}
                className="text-xs text-emerald-700 hover:bg-emerald-50"
              >
                Restore Account
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                icon={Trash2}
                onClick={() => setShowDeleteConfirm(true)}
                disabled={busy}
                className="border-rose-200 text-xs text-rose-600 hover:bg-rose-50"
              >
                Delete Account
              </Button>
            )}
          </div>
        </div>

        {/* Sub-Header Tabs */}
        <div className="flex shrink-0 gap-4 border-b border-gray-200 px-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`border-b-2 py-3 transition ${
              activeTab === "overview"
                ? "border-brand-900 text-brand-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Guest Profile & Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stays")}
            className={`flex items-center gap-1.5 border-b-2 py-3 transition ${
              activeTab === "stays"
                ? "border-brand-900 text-brand-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Stay History & Reservations
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
              {stays.length}
            </span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {banner && (
            <InlineBanner variant={banner.variant}>
              {banner.message}
            </InlineBanner>
          )}

          {/* Regenerated Credentials Alert Box */}
          {generatedCreds && (
            <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Key className="h-4 w-4 text-amber-600" />
                  <span>Temporary Guest Portal Password Generated</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGeneratedCreds(null)}
                  className="text-xs text-amber-600 hover:text-amber-800"
                >
                  Dismiss
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600">
                  Username: <strong>{generatedCreds.username}</strong>
                </span>
                <span className="text-xs text-gray-600">
                  Password:{" "}
                  <strong className="rounded border border-amber-300 bg-white px-2 py-0.5 font-mono">
                    {generatedCreds.temporaryPassword}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(generatedCreds.temporaryPassword)
                  }
                  className="text-brand-700 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy Password"}
                </button>
              </div>
            </div>
          )}

          {/* Delete Confirmation Box */}
          {showDeleteConfirm && (
            <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-900">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                <span>Confirm Soft Deletion</span>
              </div>
              <p className="text-xs text-rose-800">
                Are you sure you want to soft delete the profile for{" "}
                <strong>{guest.name}</strong>? Their login will be deactivated,
                but historical records will remain intact.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSoftDelete}
                  disabled={busy}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  {busy ? "Deleting..." : "Confirm Soft Delete"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW & IDENTITY */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Profile Card */}
              <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                <h4 className="border-b border-gray-100 pb-2 text-xs font-bold tracking-wider text-gray-700 uppercase">
                  Contact & Identity Details
                </h4>

                <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                  <div>
                    <span className="block text-[11px] text-gray-400">
                      Phone Number
                    </span>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="truncate font-semibold text-gray-900">
                        {guest.phone || "Not specified"}
                      </span>
                      {guest.phone && (
                        <a
                          href={`tel:${guest.phone}`}
                          className="text-brand-600 hover:underline"
                          title="Call Guest"
                        >
                          <Phone className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] text-gray-400">
                      Email Address
                    </span>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="truncate font-semibold text-gray-900">
                        {guest.email || "Not specified"}
                      </span>
                      {guest.email && (
                        <a
                          href={`mailto:${guest.email}`}
                          className="text-brand-600 hover:underline"
                          title="Email Guest"
                        >
                          <Mail className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] text-gray-400">
                      ID Document
                    </span>
                    <span className="mt-0.5 block font-semibold text-gray-900">
                      {guest.idType || "Aadhaar"}:{" "}
                      {guest.idNumber || "Not recorded"}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] text-gray-400">
                      Nationality
                    </span>
                    <span className="mt-0.5 block font-semibold text-gray-900">
                      {guest.nationality || "Indian"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-2 text-xs sm:grid-cols-2">
                  <div>
                    <span className="block text-[11px] text-gray-400">
                      Address / Location
                    </span>
                    <span className="mt-0.5 block font-medium text-gray-800">
                      {guest.address || "No residential address on file"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-gray-400">
                      Account Created
                    </span>
                    <span className="mt-0.5 block font-medium text-gray-800">
                      {guest.createdAt
                        ? new Date(guest.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold tracking-wider text-gray-700 uppercase">
                    KYC & Identity Documents
                  </h4>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                    {guest.documents?.length || 0} Attached
                  </span>
                </div>

                {guest.documents && guest.documents.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {guest.documents.map((doc, idx) => (
                      <div
                        key={doc.id || doc.filename || idx}
                        className="flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 truncate font-semibold text-gray-800">
                            <FileText className="text-brand-600 h-4 w-4 shrink-0" />
                            <span className="truncate">
                              {doc.filename || "ID Document"}
                            </span>
                          </div>
                          <span className="mt-1 block text-[10px] text-gray-400">
                            Type: {doc.docType || "Identity"}
                          </span>
                        </div>
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-700 mt-3 inline-flex items-center gap-1 text-[11px] font-semibold hover:underline"
                          >
                            View Document
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-3 text-center text-xs text-gray-400">
                    No physical or digital documents uploaded for this guest
                    profile.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ALL STAY DETAILS (LIST & DETAIL EXPANDER) */}
          {activeTab === "stays" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    All Guest Stays ({stays.length})
                  </h4>
                  <p className="text-xs text-gray-500">
                    Click any stay row below to inspect its detailed reservation
                    & folio billing
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={handleNewReservation}
                >
                  Book Next Stay
                </Button>
              </div>

              {stays.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-xs">
                  <Calendar className="mx-auto h-10 w-10 text-gray-300" />
                  <h3 className="mt-2 text-sm font-bold text-gray-900">
                    No Reservations Found
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
                    This guest does not have any recorded stays or bookings in
                    the system yet.
                  </p>
                  <div className="mt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Plus}
                      onClick={handleNewReservation}
                    >
                      Create First Stay
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-gray-100 bg-gray-50 font-semibold text-gray-600">
                        <tr>
                          <th className="px-4 py-3">Reservation #</th>
                          <th className="px-4 py-3">Room</th>
                          <th className="px-4 py-3">Dates</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-3 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {stays.map((s) => {
                          const isSelected = selectedStay?.id === s.id;
                          return (
                            <React.Fragment key={s.id || s.reservationNo}>
                              <tr
                                onClick={() =>
                                  setSelectedStay(isSelected ? null : s)
                                }
                                className={`cursor-pointer transition hover:bg-blue-50/40 ${
                                  isSelected ? "bg-blue-50/80 font-medium" : ""
                                }`}
                              >
                                <td className="px-4 py-3.5 font-mono font-bold text-gray-900">
                                  #{s.reservationNo}
                                </td>
                                <td className="px-4 py-3.5">
                                  {s.roomNumber ? (
                                    <div>
                                      <span className="text-brand-900 font-bold">
                                        Room {s.roomNumber}
                                      </span>
                                      <span className="block text-[10px] text-gray-500">
                                        {s.roomType}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">
                                      Unassigned
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 text-gray-600">
                                  {s.checkIn && s.checkOut
                                    ? `${s.checkIn} → ${s.checkOut} (${s.nights}n)`
                                    : "Dates not set"}
                                </td>
                                <td className="px-4 py-3.5">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                      s.status === "checked-in"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : s.status === "reserved" ||
                                            s.status === "confirmed"
                                          ? "bg-blue-100 text-blue-800"
                                          : s.status === "draft"
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {s.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                                  {formatCurrency(s.totalAmount || 0)}
                                </td>
                                <td className="px-3 py-3.5 text-right">
                                  <ChevronRight
                                    className={`inline h-4 w-4 text-gray-400 transition-transform ${
                                      isSelected
                                        ? "text-brand-600 rotate-90"
                                        : ""
                                    }`}
                                  />
                                </td>
                              </tr>

                              {/* Detailed Stay Sub-View */}
                              {isSelected && (
                                <tr className="border-t border-b border-blue-200 bg-gray-50/90">
                                  <td colSpan={6} className="p-4">
                                    <div className="space-y-3 rounded-xl border border-blue-100 bg-white p-4 shadow-xs">
                                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="text-brand-600 h-4 w-4" />
                                          <h5 className="text-xs font-bold text-gray-900">
                                            Stay Breakdown: Reservation #
                                            {s.reservationNo}
                                          </h5>
                                        </div>
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                                          Source: {s.source}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                                        <div>
                                          <span className="block text-[10px] text-gray-400">
                                            Assigned Room
                                          </span>
                                          <strong className="text-gray-900">
                                            {s.roomNumber
                                              ? `Room ${s.roomNumber} (${s.roomType})`
                                              : "Unassigned"}
                                          </strong>
                                        </div>
                                        <div>
                                          <span className="block text-[10px] text-gray-400">
                                            Stay Period
                                          </span>
                                          <strong className="text-gray-900">
                                            {s.checkIn} → {s.checkOut} (
                                            {s.nights} nights)
                                          </strong>
                                        </div>
                                        <div>
                                          <span className="block text-[10px] text-gray-400">
                                            Meal Plan
                                          </span>
                                          <strong className="text-gray-900">
                                            {s.mealPlan || "Room Only"}
                                          </strong>
                                        </div>
                                        <div>
                                          <span className="block text-[10px] text-gray-400">
                                            Payment Status
                                          </span>
                                          <strong
                                            className={`capitalize ${s.paymentStatus === "paid" ? "text-emerald-700" : "text-amber-700"}`}
                                          >
                                            {s.paymentStatus || "Unpaid"}
                                          </strong>
                                        </div>
                                      </div>

                                      {s.specialRequests && (
                                        <div className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
                                          <strong>Special Requests:</strong>{" "}
                                          {s.specialRequests}
                                        </div>
                                      )}

                                      <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-xs">
                                        <div className="text-gray-500">
                                          Grand Total:{" "}
                                          <strong className="text-sm text-gray-900">
                                            {formatCurrency(s.totalAmount)}
                                          </strong>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            onClose();
                                            navigate("/reservations");
                                          }}
                                          className="text-xs"
                                        >
                                          View All in Reservations
                                        </Button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
