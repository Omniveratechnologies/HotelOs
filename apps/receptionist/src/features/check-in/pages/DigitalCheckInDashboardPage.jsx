import { useState } from "react";
import {
  CheckCircle,
  Loader2,
  MessageCircle,
  Monitor,
  Trash2,
  User,
  X,
  FileText,
  Send,
} from "lucide-react";
import {
  Button,
  Header,
  KpiTile,
  KpiTileRow,
  StatusChip,
  TabsWithCounts,
  FilterBar,
  EmptyState,
  Modal,
  InlineBanner,
  Input,
} from "@hotelos/ui/components";
import { formatDate, formatTime } from "@hotelos/utils";
import { useCheckInSessions } from "../hooks/useCheckInSessions.js";
import { useAiosellRoomTypes } from "../../settings/hooks/useHotelSettings.js";
import {
  approveCheckInSession,
  rejectCheckInSession,
  requestCheckInCorrection,
  resendCheckInLink,
  deleteCheckInSession,
  sendCheckInLink,
} from "@hotelos/api";

const STATUS_LABELS = {
  "link-sent": "Link Sent",
  "in-progress": "In Progress",
  submitted: "Submitted",
  "correction-requested": "Correction Requested",
  approved: "Approved & Checked-in",
  rejected: "Rejected",
  expired: "Expired",
};

const STATUS_CHIP_VARIANTS = {
  "link-sent": "info",
  "in-progress": "info",
  submitted: "pending",
  "correction-requested": "pending",
  approved: "approved",
  rejected: "rejected",
  expired: "expired",
};

const TAB_OPTIONS = [
  { id: "all", label: "All" },
  { id: "link-sent", label: "Sent" },
  { id: "in-progress", label: "In Progress" },
  { id: "submitted", label: "Submitted" },
  { id: "correction-requested", label: "Correction Requested" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "expired", label: "Expired" },
];

const SOURCE_OPTIONS = [
  { value: "all", label: "All Sources" },
  { value: "direct", label: "Direct" },
  { value: "website", label: "Website" },
  { value: "phone", label: "Phone" },
  { value: "corporate", label: "Corporate" },
  { value: "group", label: "Group" },
  { value: "repeat", label: "Repeat Guest" },
  { value: "ota", label: "OTA" },
  { value: "walk-in", label: "Walk-in" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  ...TAB_OPTIONS.filter((t) => t.id !== "all").map((t) => ({
    value: t.id,
    label: t.label,
  })),
];

export default function DigitalCheckInDashboardPage() {
  const [filters, setFilters] = useState({
    dateRange: "today",
    source: "all",
    roomType: "all",
    status: "all",
    search: "",
  });
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSessionForModal, setSelectedSessionForModal] = useState(null);

  // User-friendly banner notification state
  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerVariant, setBannerVariant] = useState("success");

  // Interactive Modals State
  const [rejectModalSession, setRejectModalSession] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const [correctionModalSession, setCorrectionModalSession] = useState(null);
  const [correctionMessage, setCorrectionMessage] = useState("");
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false);

  const [isSendLinkOpen, setIsSendLinkOpen] = useState(false);
  const [sendReservationId, setSendReservationId] = useState("");
  const [sendEmail, setSendEmail] = useState("");
  const [sendNote, setSendNote] = useState("");
  const [sendSubmitting, setSendSubmitting] = useState(false);

  const [deleteConfirmSession, setDeleteConfirmSession] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const { stats, sessions, loading, error, refetch } =
    useCheckInSessions(filters);

  const { aiosellRoomTypes } = useAiosellRoomTypes();
  const roomTypeOptions = [
    { value: "all", label: "All Room Types" },
    ...aiosellRoomTypes.map((rt) => ({
      value: rt.code,
      label: rt.name,
    })),
  ];

  const showNotification = (msg, variant = "success") => {
    setBannerMsg(msg);
    setBannerVariant(variant);
    setTimeout(() => {
      setBannerMsg("");
    }, 5000);
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      search: newFilters.search ?? prev.search,
    }));
    refetch();
  };

  const handleTabChange = (status) => {
    setActiveTab(status);
  };

  const filteredSessions = sessions.filter((session) => {
    if (activeTab !== "all" && session.status !== activeTab) return false;
    if (filters.source !== "all" && session.booking?.source !== filters.source)
      return false;
    if (
      filters.roomType !== "all" &&
      session.room?.type?.toLowerCase() !== filters.roomType.toLowerCase()
    )
      return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        (session.guestName &&
          session.guestName.toLowerCase().includes(searchTerm)) ||
        (session.reservationNo &&
          session.reservationNo.toLowerCase().includes(searchTerm)) ||
        (session.guestEmail &&
          session.guestEmail.toLowerCase().includes(searchTerm)) ||
        (session.room?.roomNumber &&
          String(session.room.roomNumber).includes(searchTerm))
      );
    }
    return true;
  });

  const handleApprove = async (sessionId) => {
    try {
      await approveCheckInSession(sessionId);
      showNotification(
        "Digital check-in approved successfully! Guest is now ready for express check-in.",
        "success",
      );
      refetch();
    } catch (err) {
      showNotification(
        err?.message || "Unable to approve check-in. Please try again.",
        "error",
      );
      console.error(err);
    }
  };

  const handleRejectSubmit = async (e) => {
    e?.preventDefault();
    if (!rejectReason.trim()) {
      showNotification(
        "Please provide a valid reason for rejecting this check-in.",
        "warning",
      );
      return;
    }
    try {
      setRejectSubmitting(true);
      await rejectCheckInSession(rejectModalSession.id, rejectReason.trim());
      showNotification(
        "Check-in submission has been rejected. The guest has been notified.",
        "success",
      );
      setRejectModalSession(null);
      setRejectReason("");
      refetch();
    } catch (err) {
      showNotification(
        err?.message || "Failed to reject check-in submission.",
        "error",
      );
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleCorrectionSubmit = async (e) => {
    e?.preventDefault();
    if (!correctionMessage.trim()) {
      showNotification(
        "Please specify the instructions or corrections needed from the guest.",
        "warning",
      );
      return;
    }
    try {
      setCorrectionSubmitting(true);
      await requestCheckInCorrection(
        correctionModalSession.id,
        correctionMessage.trim(),
      );
      showNotification(
        "Correction request sent to guest. The submission is now marked for guest update.",
        "success",
      );
      setCorrectionModalSession(null);
      setCorrectionMessage("");
      refetch();
    } catch (err) {
      showNotification(
        err?.message || "Failed to submit correction request.",
        "error",
      );
    } finally {
      setCorrectionSubmitting(false);
    }
  };

  const handleResendLink = async (sessionId) => {
    try {
      await resendCheckInLink(sessionId);
      showNotification(
        "Check-in link resent successfully to the guest's contact email.",
        "success",
      );
      refetch();
    } catch (err) {
      showNotification(
        err?.message || "Failed to resend check-in link.",
        "error",
      );
      console.error(err);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteConfirmSession) return;
    try {
      setDeleteSubmitting(true);
      await deleteCheckInSession(deleteConfirmSession.id);
      showNotification("Check-in session removed successfully.", "success");
      setDeleteConfirmSession(null);
      refetch();
    } catch (err) {
      showNotification(
        err?.message || "Failed to delete check-in session.",
        "error",
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleSendLinkSubmit = async (e) => {
    e?.preventDefault();
    if (!sendReservationId.trim()) {
      showNotification(
        "Please enter a valid Booking Reference / ID.",
        "warning",
      );
      return;
    }
    try {
      setSendSubmitting(true);
      await sendCheckInLink({
        reservationId: sendReservationId.trim(),
        email: sendEmail.trim() || undefined,
        message: sendNote.trim() || undefined,
      });
      showNotification(
        "Check-in invitation successfully sent to guest!",
        "success",
      );
      setIsSendLinkOpen(false);
      setSendReservationId("");
      setSendEmail("");
      setSendNote("");
      refetch();
    } catch (err) {
      showNotification(
        err?.message ||
          "Could not send check-in link. Please verify the booking reference.",
        "error",
      );
    } finally {
      setSendSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="bg-background-50 min-h-screen">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center">
            <X className="mb-2 h-8 w-8 text-rose-500" />
            <p className="text-brand-900">{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                refetch();
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = TAB_OPTIONS.map((t) => ({
    id: t.id,
    label: t.label,
    count: sessions.filter((s) => s.status === t.id).length,
  }));

  const handleDateRangeChange = (range) => {
    handleFilterChange({ dateRange: range });
  };

  const handleSelectChange = (key, value) => {
    handleFilterChange({ [key]: value });
  };

  const handleSearchChange = (value) => {
    handleFilterChange({ search: value });
  };

  const handleClearFilters = () => {
    setFilters({
      dateRange: "today",
      source: "all",
      roomType: "all",
      status: "all",
      search: "",
    });
  };

  return (
    <div className="bg-background-50 min-h-screen">
      <main className="min-w-0 flex-1">
        <div className="px-4 sm:px-6 lg:px-8">
          <Header
            pageTitle="Digital Check-in Dashboard"
            pageDescription="Send secure check-in link to guests and verify submitted check-ins"
          >
            <Button
              variant="primary"
              icon={Send}
              onClick={() => setIsSendLinkOpen(true)}
            >
              + Send Check-in Link
            </Button>
          </Header>

          {bannerMsg && (
            <div className="mb-6">
              <InlineBanner variant={bannerVariant}>{bannerMsg}</InlineBanner>
            </div>
          )}

          {/* Stats and Tabs */}
          {!stats ? null : (
            <KpiTileRow className="mb-6">
              <KpiTile
                icon={Monitor}
                iconClassName="bg-blue-50 text-blue-700"
                value={stats.linksSentToday}
                label="Links Sent Today"
                delta={
                  stats.linksSentTodayChange >= 0
                    ? `+${stats.linksSentTodayChange}%`
                    : `${stats.linksSentTodayChange}%`
                }
                deltaTone={stats.linksSentTodayChange >= 0 ? "up" : "down"}
              />
              <KpiTile
                icon={CheckCircle}
                iconClassName="bg-emerald-50 text-emerald-700"
                value={stats.submitted}
                label="Submitted"
                delta={`${stats.submittedPercentage}% completion`}
                deltaTone="neutral"
              />
              <KpiTile
                icon={MessageCircle}
                iconClassName="bg-amber-50 text-amber-700"
                value={stats.pendingVerification}
                label="Pending Verification"
                delta={
                  stats.pendingVerificationChange >= 0
                    ? `+${stats.pendingVerificationChange}%`
                    : `${stats.pendingVerificationChange}%`
                }
                deltaTone={stats.pendingVerificationChange >= 0 ? "up" : "down"}
              />
              <KpiTile
                icon={CheckCircle}
                iconClassName="bg-emerald-50 text-emerald-700"
                value={stats.approved}
                label="Approved & Checked-in"
                delta="Completed"
                deltaTone="up"
              />
              <KpiTile
                icon={X}
                iconClassName="bg-rose-50 text-rose-700"
                value={stats.rejected}
                label="Rejected"
                delta="Needs Action"
                deltaTone="down"
              />
            </KpiTileRow>
          )}

          <TabsWithCounts
            tabs={tabs}
            activeId={activeTab}
            onChange={handleTabChange}
            className="mb-4"
          />

          <FilterBar
            dateRange={{
              from: filters.dateRange === "today" ? formatDate(new Date()) : "",
              to: "",
            }}
            onDateRangeChange={handleDateRangeChange}
            selects={[
              {
                key: "source",
                label: "All Sources",
                options: SOURCE_OPTIONS,
                value: filters.source,
              },
              {
                key: "roomType",
                label: "All Room Types",
                options: roomTypeOptions,
                value: filters.roomType,
              },
              {
                key: "status",
                label: "All Status",
                options: STATUS_OPTIONS,
                value: filters.status,
              },
            ]}
            onSelectChange={handleSelectChange}
            search={filters.search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search by guest name, booking ref, email, or room..."
            onClear={handleClearFilters}
          />

          {/* Sessions Table */}
          <div className="rounded-xl bg-white p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-muted-500 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Guest
                    </th>
                    <th className="text-muted-500 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Booking No.
                    </th>
                    <th className="text-muted-500 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Room No.
                    </th>
                    <th className="text-muted-500 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Link Sent On
                    </th>
                    <th className="text-muted-500 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Submitted On
                    </th>
                    <th className="text-muted-500 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Status
                    </th>
                    <th className="text-muted-500 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    Array.from({ length: 5 }, (rowIdx) => (
                      <tr key={rowIdx}>
                        {Array.from({ length: 7 }, (cellIdx) => (
                          <td key={cellIdx} className="px-6 py-4">
                            <div className="h-4 animate-pulse rounded bg-gray-100" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredSessions.length === 0 ? (
                    <tr>
                      <td
                        className="text-muted-500 px-6 py-4 text-center"
                        colSpan="7"
                      >
                        <EmptyState
                          icon={User}
                          title="No check-in sessions found"
                          hint="Adjust the filters, or send a new check-in link."
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="flex items-center space-x-3 px-6 py-4">
                          {session.guest?.avatar ? (
                            <img
                              src={session.guest.avatar}
                              alt={session.guest.name}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <div className="bg-muted-200 flex h-10 w-10 items-center justify-center rounded-full">
                              {session.guest?.name
                                ? session.guest.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                : "?"}
                            </div>
                          )}
                          <div className="text-left">
                            <p className="text-brand-900 text-sm font-medium">
                              {session.guestName || "Valued Guest"}
                            </p>
                            {session.guest?.email && (
                              <p className="text-muted-500 text-sm">
                                {session.guest.email}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="text-muted-500 px-6 py-4 font-mono text-sm">
                          {session.reservationNo || "-"}
                        </td>
                        <td className="text-muted-500 px-6 py-4 text-sm">
                          {session.room?.roomNumber
                            ? `Room ${session.room.roomNumber}`
                            : "-"}
                        </td>
                        <td className="text-muted-500 px-6 py-4 text-sm">
                          {session.sentAt
                            ? `${formatDate(new Date(session.sentAt))} ${formatTime(new Date(session.sentAt))}`
                            : "-"}
                        </td>
                        <td className="text-muted-500 px-6 py-4 text-sm">
                          {session.submittedAt
                            ? `${formatDate(new Date(session.submittedAt))} ${formatTime(new Date(session.submittedAt))}`
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <StatusChip
                            variant={
                              STATUS_CHIP_VARIANTS[session.status] || "neutral"
                            }
                          >
                            {STATUS_LABELS[session.status]}
                          </StatusChip>
                        </td>
                        <td className="text-muted-500 flex flex-col space-y-2 px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() =>
                                setSelectedSessionForModal(session)
                              }
                            >
                              <User className="mr-1 h-4 w-4" /> View
                            </Button>
                            {(session.status === "link-sent" ||
                              session.status === "expired") && (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleResendLink(session.id)}
                              >
                                <Loader2 className="mr-1 h-4 w-4" /> Resend Link
                              </Button>
                            )}
                            {(session.status === "submitted" ||
                              session.status === "correction-requested") && (
                              <>
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => {
                                    setCorrectionModalSession(session);
                                    setCorrectionMessage("");
                                  }}
                                >
                                  <MessageCircle className="mr-1 h-4 w-4" />{" "}
                                  Request Correction
                                </Button>
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => {
                                    setRejectModalSession(session);
                                    setRejectReason("");
                                  }}
                                  className="text-rose-500 hover:text-rose-700"
                                >
                                  <X className="mr-1 h-4 w-4" /> Reject
                                </Button>
                                <Button
                                  variant="primary"
                                  size="xs"
                                  onClick={() => handleApprove(session.id)}
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />{" "}
                                  Approve & Check-in
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => setDeleteConfirmSession(session)}
                              className="text-muted-500 hover:text-rose-600"
                            >
                              <Trash2 className="mr-1 h-4 w-4" /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredSessions.length > 0 && (
              <div className="text-muted-500 pt-4 text-sm">
                Showing {filteredSessions.length} of {sessions.length} sessions
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Send Check-in Link Modal */}
      {isSendLinkOpen && (
        <Modal
          isOpen={isSendLinkOpen}
          onClose={() => setIsSendLinkOpen(false)}
          title="Send Digital Check-in Link"
          size="md"
        >
          <form onSubmit={handleSendLinkSubmit} className="space-y-4">
            <p className="text-xs text-gray-500">
              Invite the guest to complete their registration and identity
              verification online prior to arrival.
            </p>
            <Input
              label="Booking Reference / Reservation No."
              placeholder="e.g. RES-2026-1001 or Booking ID"
              value={sendReservationId}
              onChange={(e) => setSendReservationId(e.target.value)}
              required
            />
            <Input
              label="Guest Email (Optional, overrides booking email)"
              placeholder="guest@example.com"
              type="email"
              value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
            />
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Custom Welcome Note (Optional)
              </label>
              <textarea
                className="focus:border-brand-900 w-full rounded-lg border border-gray-200 p-2.5 text-xs text-gray-900 focus:outline-none"
                rows={3}
                placeholder="We look forward to welcoming you! Please complete this fast check-in form to ensure priority room key handover."
                value={sendNote}
                onChange={(e) => setSendNote(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setIsSendLinkOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={sendSubmitting}
                icon={Send}
              >
                Dispatch Link
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectModalSession && (
        <Modal
          isOpen={Boolean(rejectModalSession)}
          onClose={() => setRejectModalSession(null)}
          title={`Reject Check-in — ${rejectModalSession.guestName || "Guest"}`}
          size="md"
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <p className="text-xs text-gray-500">
              Select or provide the reason for declining this digital check-in
              submission:
            </p>
            <div className="space-y-2">
              {[
                "Submitted ID document is blurry or unreadable.",
                "Government photo ID has expired.",
                "Name on identity proof does not match reservation.",
                "Live photo (selfie) does not match submitted photo ID.",
                "Invalid document type submitted.",
              ].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setRejectReason(preset)}
                  className={`w-full rounded-lg border p-2 text-left text-xs transition ${
                    rejectReason === preset
                      ? "border-rose-500 bg-rose-50 font-semibold text-rose-900"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Custom Rejection Reason
              </label>
              <textarea
                className="focus:border-brand-900 w-full rounded-lg border border-gray-200 p-2.5 text-xs text-gray-900 focus:outline-none"
                rows={3}
                placeholder="Enter specific details explaining why this submission cannot be approved..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setRejectModalSession(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={rejectSubmitting}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                Confirm Rejection
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Correction Request Modal */}
      {correctionModalSession && (
        <Modal
          isOpen={Boolean(correctionModalSession)}
          onClose={() => setCorrectionModalSession(null)}
          title={`Request Correction — ${correctionModalSession.guestName || "Guest"}`}
          size="md"
        >
          <form onSubmit={handleCorrectionSubmit} className="space-y-4">
            <p className="text-xs text-gray-500">
              Select preset instructions or enter guidance for the guest to
              resubmit their details:
            </p>
            <div className="space-y-2">
              {[
                "Please upload a clear, high-resolution photo of your government ID.",
                "Please provide a photo of the reverse side of your ID proof.",
                "Please capture a clear live photo without sunglasses or cap.",
                "Please provide a complete signature on the card.",
              ].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setCorrectionMessage(preset)}
                  className={`w-full rounded-lg border p-2 text-left text-xs transition ${
                    correctionMessage === preset
                      ? "border-amber-500 bg-amber-50 font-semibold text-amber-900"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Instructions for Guest
              </label>
              <textarea
                className="focus:border-brand-900 w-full rounded-lg border border-gray-200 p-2.5 text-xs text-gray-900 focus:outline-none"
                rows={3}
                placeholder="Explain what needs to be updated..."
                value={correctionMessage}
                onChange={(e) => setCorrectionMessage(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setCorrectionModalSession(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={correctionSubmitting}
              >
                Send Request to Guest
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmSession && (
        <Modal
          isOpen={Boolean(deleteConfirmSession)}
          onClose={() => setDeleteConfirmSession(null)}
          title="Delete Check-in Session"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Are you sure you want to permanently delete this digital check-in
              session for{" "}
              <strong>{deleteConfirmSession.guestName || "this guest"}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirmSession(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteSubmit}
                loading={deleteSubmitting}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                Delete Session
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Session Details & KYC Documents Modal */}
      {selectedSessionForModal && (
        <Modal
          isOpen={Boolean(selectedSessionForModal)}
          onClose={() => setSelectedSessionForModal(null)}
          title={`Check-in Details — ${selectedSessionForModal.guestName || "Guest"}`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Guest & Reservation Header Bar */}
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 text-xs sm:grid-cols-4">
              <div>
                <span className="block text-gray-500">Booking Reference</span>
                <strong className="font-mono text-gray-900">
                  {selectedSessionForModal.reservationNo || "—"}
                </strong>
              </div>
              <div>
                <span className="block text-gray-500">Room Assignment</span>
                <strong className="text-gray-900">
                  {selectedSessionForModal.room?.roomNumber
                    ? `Room ${selectedSessionForModal.room.roomNumber}`
                    : "Unassigned"}
                </strong>
              </div>
              <div>
                <span className="block text-gray-500">Phone Number</span>
                <strong className="text-gray-900">
                  {selectedSessionForModal.guestPhone || "—"}
                </strong>
              </div>
              <div>
                <span className="block text-gray-500">Session Status</span>
                <span className="mt-0.5 inline-block">
                  <StatusChip
                    variant={
                      STATUS_CHIP_VARIANTS[selectedSessionForModal.status] ||
                      "neutral"
                    }
                  >
                    {STATUS_LABELS[selectedSessionForModal.status]}
                  </StatusChip>
                </span>
              </div>
            </div>

            {/* Uploaded Identity Documents */}
            <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="text-brand-600 h-4 w-4" />
                  <h4 className="text-xs font-bold tracking-wider text-gray-800 uppercase">
                    Uploaded KYC Documents (
                    {selectedSessionForModal.stepData?.documents?.length || 0})
                  </h4>
                </div>
                <span className="text-[11px] font-medium text-gray-500">
                  Front side required · Back side optional
                </span>
              </div>

              {selectedSessionForModal.stepData?.documents &&
              selectedSessionForModal.stepData.documents.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {selectedSessionForModal.stepData.documents.map(
                    (doc, idx) => (
                      <div
                        key={
                          doc.idNumber
                            ? `${doc.idType}_${doc.idNumber}_${idx}`
                            : `doc_${idx}`
                        }
                        className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/70 p-3"
                      >
                        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                          <span className="text-xs font-bold text-gray-900">
                            {doc.idType}
                          </span>
                          <span className="font-mono text-[11px] text-gray-600">
                            {doc.idNumber || "—"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                          <div>
                            <span className="mb-1 block text-[10px] text-gray-500">
                              Front Side
                            </span>
                            {doc.front?.url ? (
                              <a
                                href={doc.front.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block h-20 w-full overflow-hidden rounded-lg border border-gray-200 bg-white"
                              >
                                <img
                                  src={doc.front.url}
                                  alt={`${doc.idType} Front`}
                                  className="h-full w-full object-cover transition group-hover:scale-105"
                                />
                              </a>
                            ) : (
                              <div className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white text-[10px] text-gray-400">
                                No Front Image
                              </div>
                            )}
                          </div>

                          <div>
                            <span className="mb-1 block text-[10px] text-gray-500">
                              Back Side
                            </span>
                            {doc.back?.url ? (
                              <a
                                href={doc.back.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block h-20 w-full overflow-hidden rounded-lg border border-gray-200 bg-white"
                              >
                                <img
                                  src={doc.back.url}
                                  alt={`${doc.idType} Back`}
                                  className="h-full w-full object-cover transition group-hover:scale-105"
                                />
                              </a>
                            ) : (
                              <div className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white text-[10px] text-gray-400">
                                Not Provided (Optional)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="py-4 text-center text-xs text-gray-400">
                  No identity documents uploaded in this check-in session.
                </p>
              )}
            </div>

            {/* Selfie & Signature */}
            {(selectedSessionForModal.stepData?.selfie?.url ||
              selectedSessionForModal.stepData?.signature?.url) && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                {selectedSessionForModal.stepData?.selfie?.url && (
                  <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                    <span className="mb-1 block text-xs font-bold text-gray-700">
                      Guest Live Photo
                    </span>
                    <img
                      src={selectedSessionForModal.stepData.selfie.url}
                      alt="Guest Selfie"
                      className="mx-auto h-20 w-20 rounded-full border border-gray-200 object-cover"
                    />
                  </div>
                )}
                {selectedSessionForModal.stepData?.signature?.url && (
                  <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                    <span className="mb-1 block text-xs font-bold text-gray-700">
                      Digital Signature
                    </span>
                    <img
                      src={selectedSessionForModal.stepData.signature.url}
                      alt="Guest Signature"
                      className="mx-auto h-20 w-full rounded-lg border border-gray-100 bg-gray-50 object-contain"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end border-t border-gray-100 pt-3">
              <Button
                variant="secondary"
                onClick={() => setSelectedSessionForModal(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
