import { useState } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle,
  Loader2,
  MessageCircle,
  Monitor,
  Trash2,
  User,
  X,
  FileText,
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
} from "@hotelos/ui/components";
import { formatDate, formatTime } from "@hotelos/utils";
import { useCheckInSessions } from "../hooks/useCheckInSessions.js";
import {
  approveCheckInSession,
  rejectCheckInSession,
  requestCheckInCorrection,
  resendCheckInLink,
  deleteCheckInSession,
} from "@hotelos/api";

const STATUS_LABELS = {
  link_sent: "Link Sent",
  in_progress: "In Progress",
  submitted: "Submitted",
  pending_verification: "Pending Verification",
  correction_requested: "Correction Requested",
  approved: "Approved & Checked-in",
  rejected: "Rejected",
  expired: "Expired",
};

const STATUS_CHIP_VARIANTS = {
  link_sent: "info",
  in_progress: "info",
  submitted: "pending",
  pending_verification: "pending",
  correction_requested: "pending",
  approved: "approved",
  rejected: "rejected",
  expired: "expired",
};

const TAB_OPTIONS = [
  { id: "all", label: "All" },
  { id: "link_sent", label: "Sent" },
  { id: "in_progress", label: "In Progress" },
  { id: "submitted", label: "Submitted" },
  { id: "pending_verification", label: "Pending Verification" },
  { id: "correction_requested", label: "Correction Requested" },
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

const ROOM_TYPE_OPTIONS = [
  { value: "all", label: "All Room Types" },
  { value: "executive", label: "Executive" },
  { value: "deluxe", label: "Deluxe" },
  { value: "premium", label: "Premium" },
  { value: "suite", label: "Suite" },
  { value: "family", label: "Family" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  ...TAB_OPTIONS.filter((t) => t.id !== "all").map((t) => ({
    value: t.id,
    label: t.label,
  })),
];

export default function DigitalCheckInDashboardPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    dateRange: "today",
    source: "all",
    roomType: "all",
    status: "all",
    search: "",
  });
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSessionForModal, setSelectedSessionForModal] = useState(null);

  const { stats, sessions, loading, error, refetch } =
    useCheckInSessions(filters);

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
      session.booking?.roomTypeId !== filters.roomType
    )
      return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        session.guest?.name?.toLowerCase().includes(searchTerm) ||
        session.booking?.reservationNo?.toLowerCase().includes(searchTerm) ||
        session.booking?.guest?.name?.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  const handleApprove = async (sessionId) => {
    try {
      await approveCheckInSession(sessionId);
      refetch();
    } catch (err) {
      setError("Failed to approve check-in");
      console.error(err);
    }
  };

  const handleReject = async (sessionId) => {
    // In a real implementation, this would open a dialog to get the rejection reason
    const reason = window.prompt("Please provide a reason for rejection:");
    if (reason === null) return; // User cancelled
    if (reason.trim() === "") {
      setError("Rejection reason is required");
      return;
    }
    try {
      await rejectCheckInSession(sessionId, reason);
      refetch();
    } catch (err) {
      setError("Failed to reject check-in");
      console.error(err);
    }
  };

  const handleRequestCorrection = async (sessionId) => {
    // In a real implementation, this would open a dialog to get the correction message
    const message = window.prompt(
      "Please provide a correction message for the guest:",
    );
    if (message === null) return; // User cancelled
    if (message.trim() === "") {
      setError("Correction message is required");
      return;
    }
    try {
      await requestCheckInCorrection(sessionId, message);
      refetch();
    } catch (err) {
      setError("Failed to request correction");
      console.error(err);
    }
  };

  const handleResendLink = async (sessionId) => {
    try {
      await resendCheckInLink(sessionId);
      refetch();
    } catch (err) {
      setError("Failed to resend check-in link");
      console.error(err);
    }
  };

  const handleDelete = async (sessionId) => {
    if (
      !window.confirm("Are you sure you want to delete this check-in session?")
    )
      return;
    try {
      await deleteCheckInSession(sessionId);
      refetch();
    } catch (err) {
      setError("Failed to delete check-in session");
      console.error(err);
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
                setError(null);
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
              onClick={() => {
                // In a real implementation, this would open a dialog to send a new check-in link
                navigate("/reservations/new"); // Placeholder
              }}
            >
              + Send Check-in Link
            </Button>
          </Header>

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
                options: ROOM_TYPE_OPTIONS,
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
            searchPlaceholder="Search by guest name or booking reference..."
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
                              {session.guest?.name || "Unknown Guest"}
                            </p>
                            {session.guest?.email && (
                              <p className="text-muted-500 text-sm">
                                {session.guest.email}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="text-muted-500 px-6 py-4 text-sm">
                          {session.booking?.reservationNo || "-"}
                        </td>
                        <td className="text-muted-500 px-6 py-4 text-sm">
                          {session.booking?.roomNumber || "-"}
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
                            {session.status === "link_sent" ||
                            session.status === "expired" ? (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleResendLink(session.id)}
                              >
                                <Loader2 className="mr-1 h-4 w-4" /> Resend Link
                              </Button>
                            ) : null}
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() =>
                                handleRequestCorrection(session.id)
                              }
                            >
                              <MessageCircle className="mr-1 h-4 w-4" /> Request
                              Correction
                            </Button>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleReject(session.id)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <X className="mr-1 h-4 w-4" /> Reject
                            </Button>
                            <Button
                              variant={
                                session.status === "pending_verification" ||
                                session.status === "submitted"
                                  ? "primary"
                                  : "outline"
                              }
                              size="xs"
                              onClick={() => handleApprove(session.id)}
                              disabled={
                                session.status !== "pending_verification" &&
                                session.status !== "submitted"
                              }
                            >
                              {session.status === "pending_verification" ||
                              session.status === "submitted" ? (
                                <>
                                  <CheckCircle className="mr-1 h-4 w-4" />{" "}
                                  Approve & Check-in
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-1 h-4 w-4" />{" "}
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleDelete(session.id)}
                              className="text-muted-500 hover:text-muted-700"
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
