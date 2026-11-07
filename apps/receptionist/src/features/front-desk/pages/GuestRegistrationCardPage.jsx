import React, { useState } from "react";
import {
  Header,
  KpiTile,
  KpiTileRow,
  Button,
  InlineBanner,
  Modal,
} from "@hotelos/ui/components";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Printer,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@hotelos/query";
import { useMyHotel } from "../../settings/hooks/useHotelSettings.js";
import {
  getCheckInSessions,
  approveCheckInSession,
  rejectCheckInSession,
  requestCheckInCorrection,
} from "@hotelos/api";

export default function GuestRegistrationCardPage() {
  const queryClient = useQueryClient();
  const { hotel } = useMyHotel();
  const [selectedReg, setSelectedReg] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerVariant, setBannerVariant] = useState("success");

  // Rejection & Correction modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionInstructions, setCorrectionInstructions] = useState("");

  // Fetch live check-in sessions
  const { data: responseData, isLoading } = useQuery({
    queryKey: ["check-in", "sessions", { status: activeTab, q: search }],
    queryFn: () => getCheckInSessions({ q: search }),
  });

  const sessions = responseData?.sessions || [];
  const stats = responseData?.stats || {
    pendingReview: 0,
    approved: 0,
    correctionRequested: 0,
    rejected: 0,
    total: 0,
  };

  const currentReg = selectedReg || (sessions.length > 0 ? sessions[0] : null);

  const approveMutation = useMutation({
    mutationFn: (id) => approveCheckInSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check-in"] });
      setBannerVariant("success");
      setBannerMsg(
        "Registration card approved successfully! Guest is verified for stay.",
      );
      setTimeout(() => setBannerMsg(""), 5000);
    },
    onError: (err) => {
      setBannerVariant("error");
      setBannerMsg(
        err?.message || "Failed to approve registration card. Please retry.",
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectCheckInSession(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check-in"] });
      setBannerVariant("error");
      setBannerMsg("Registration card rejected. The guest has been notified.");
      setRejectModalOpen(false);
      setRejectReason("");
      setTimeout(() => setBannerMsg(""), 5000);
    },
    onError: (err) => {
      setBannerVariant("error");
      setBannerMsg(err?.message || "Failed to reject registration card.");
    },
  });

  const correctionMutation = useMutation({
    mutationFn: ({ id, instructions }) =>
      requestCheckInCorrection(id, instructions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check-in"] });
      setBannerVariant("warning");
      setBannerMsg("Correction instructions dispatched to guest.");
      setCorrectionModalOpen(false);
      setCorrectionInstructions("");
      setTimeout(() => setBannerMsg(""), 5000);
    },
    onError: (err) => {
      setBannerVariant("error");
      setBannerMsg(err?.message || "Failed to request correction.");
    },
  });

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === "pending" && s.status !== "submitted") return false;
    if (activeTab === "approved" && s.status !== "approved") return false;
    if (activeTab === "correction" && s.status !== "correction-requested")
      return false;
    if (activeTab === "rejected" && s.status !== "rejected") return false;
    return true;
  });

  return (
    <div className="bg-background-50/50 min-h-screen pb-24">
      <Header
        pageTitle="Guest Registration Cards"
        pageDescription="Review, approve, and audit electronic guest registration cards (GRC) and identity submissions"
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* KPI Tiles (5) */}
        <KpiTileRow>
          <KpiTile
            label="Pending Review"
            value={stats.pendingReview}
            icon={Clock}
            iconClassName="bg-amber-50 text-amber-700"
          />
          <KpiTile
            label="Approved"
            value={stats.approved}
            icon={CheckCircle2}
            iconClassName="bg-emerald-50 text-emerald-700"
          />
          <KpiTile
            label="Correction Needed"
            value={stats.correctionRequested}
            icon={AlertCircle}
            iconClassName="bg-rose-50 text-rose-700"
          />
          <KpiTile
            label="Rejected"
            value={stats.rejected}
            icon={XCircle}
            iconClassName="bg-gray-100 text-gray-700"
          />
          <KpiTile
            label="Total Submitted"
            value={stats.total}
            icon={FileText}
            iconClassName="bg-brand-50 text-brand-700"
          />
        </KpiTileRow>

        {bannerMsg && (
          <InlineBanner variant={bannerVariant}>{bannerMsg}</InlineBanner>
        )}

        {/* Tab & Search Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-b border-gray-200 pb-3 text-xs sm:flex-row">
          <div className="flex gap-2">
            {[
              { id: "all", label: "All Cards" },
              { id: "pending", label: "Pending Review" },
              { id: "approved", label: "Approved" },
              { id: "correction", label: "Correction Requested" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                  activeTab === t.id
                    ? "bg-brand-900 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="focus:border-brand-500 w-full rounded-lg border border-gray-200 py-1.5 pr-3 pl-8 text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* 2-Column Split: List + GRC Viewer */}
        <div className="grid grid-cols-12 items-start gap-6">
          {/* Left Column: Reg Cards List (4 cols) */}
          <div className="col-span-12 space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs lg:col-span-4">
            <h3 className="text-xs font-bold tracking-wider text-gray-700 uppercase">
              Registration Submissions ({filteredSessions.length})
            </h3>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-gray-500">
                Loading registration cards...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No registration submissions found.
              </div>
            ) : (
              <div className="max-h-[560px] space-y-2 overflow-y-auto">
                {filteredSessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedReg(s)}
                    className={`cursor-pointer rounded-xl border p-3 text-xs transition ${
                      currentReg?.id === s.id
                        ? "border-brand-500 bg-brand-50/50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span>{s.guestName || "Valued Guest"}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          s.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : s.status === "submitted"
                              ? "bg-amber-100 text-amber-800"
                              : s.status === "correction-requested"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-gray-500">
                      {s.reservationNo || "—"} · Room{" "}
                      {s.room?.roomNumber || "Unassigned"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Full GRC Preview Document (8 cols) */}
          <div className="col-span-12 space-y-6 lg:col-span-8">
            {!currentReg ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-xs">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-3 text-sm font-bold text-gray-900">
                  Select a Registration Card
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
                  Click a registration card on the left to inspect documents,
                  signature, and verification details.
                </p>
              </div>
            ) : (
              <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
                {/* Official Hotel Header */}
                <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-gray-900">
                      {hotel?.name || "Hotel OS"}
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {[
                        hotel?.address,
                        hotel?.city,
                        hotel?.state,
                        hotel?.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-gray-500">
                      {hotel?.phone && <span>Tel: {hotel.phone}</span>}
                      {hotel?.email && <span>Email: {hotel.email}</span>}
                      {hotel?.gstin && (
                        <span className="text-brand-900 font-mono font-semibold">
                          GSTIN: {hotel.gstin}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Printer}
                      onClick={() => window.print()}
                    >
                      Print GRC
                    </Button>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        currentReg.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : currentReg.status === "submitted"
                            ? "bg-amber-100 text-amber-800"
                            : currentReg.status === "correction-requested"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {currentReg.status}
                    </span>
                  </div>
                </div>

                {/* Guest & Reservation Info */}
                <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {currentReg.guestName || "Valued Guest"}
                    </h3>
                    <p className="mt-0.5 font-mono text-xs text-gray-500">
                      Booking: {currentReg.reservationNo || "—"} · Phone:{" "}
                      {currentReg.guestPhone || "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs text-gray-500">Room</span>
                    <strong className="text-brand-900 text-sm">
                      {currentReg.room?.roomNumber
                        ? `Room ${currentReg.room.roomNumber}`
                        : "Unassigned"}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 text-xs sm:grid-cols-3">
                  <div>
                    <span className="block text-gray-500">Guest Email</span>
                    <strong className="font-mono text-gray-800">
                      {currentReg.guestEmail || "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-gray-500">Submitted On</span>
                    <strong className="text-gray-800">
                      {currentReg.submittedAt
                        ? new Date(currentReg.submittedAt).toLocaleDateString()
                        : "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-gray-500">Session ID</span>
                    <strong className="font-mono text-[11px] text-gray-800">
                      {currentReg.id?.slice(-8) || "—"}
                    </strong>
                  </div>
                </div>

                {/* Uploaded Identity Documents Gallery */}
                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold tracking-wider text-gray-700 uppercase">
                      Identity &amp; KYC Documents (
                      {currentReg.stepData?.documents?.length || 0})
                    </h4>
                    <span className="text-[11px] font-semibold text-gray-500">
                      Front side verified · Back side optional
                    </span>
                  </div>

                  {currentReg.stepData?.documents &&
                  currentReg.stepData.documents.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {currentReg.stepData.documents.map((doc, idx) => (
                        <div
                          key={
                            doc.idNumber
                              ? `${doc.idType}_${doc.idNumber}_${idx}`
                              : `doc_${idx}`
                          }
                          className="space-y-2 rounded-xl border border-gray-200 bg-white p-3 shadow-2xs"
                        >
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <span className="text-xs font-bold text-gray-900">
                              {doc.idType || "ID Document"}
                            </span>
                            <span className="font-mono text-[11px] text-gray-600">
                              {doc.idNumber || "—"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-center">
                            {/* Front Image */}
                            <div className="space-y-1">
                              <span className="block text-[10px] font-semibold text-gray-500">
                                Front Side
                              </span>
                              {doc.front?.url ? (
                                <a
                                  href={doc.front.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group relative flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                                >
                                  <img
                                    src={doc.front.url}
                                    alt={`${doc.idType} Front`}
                                    className="h-full w-full object-cover transition group-hover:scale-105"
                                  />
                                </a>
                              ) : (
                                <div className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-[10px] text-gray-400">
                                  No Front Image
                                </div>
                              )}
                            </div>

                            {/* Back Image */}
                            <div className="space-y-1">
                              <span className="block text-[10px] font-semibold text-gray-500">
                                Back Side
                              </span>
                              {doc.back?.url ? (
                                <a
                                  href={doc.back.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group relative flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                                >
                                  <img
                                    src={doc.back.url}
                                    alt={`${doc.idType} Back`}
                                    className="h-full w-full object-cover transition group-hover:scale-105"
                                  />
                                </a>
                              ) : (
                                <div className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-[10px] text-gray-400">
                                  Not Uploaded (Optional)
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-2 text-center text-xs text-gray-400">
                      No identity documents submitted with this registration
                      card.
                    </p>
                  )}
                </div>

                {/* Selfie & Signature Previews */}
                {(currentReg.stepData?.selfie?.url ||
                  currentReg.stepData?.signature?.url) && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {currentReg.stepData?.selfie?.url && (
                      <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                        <span className="mb-1 block text-xs font-bold text-gray-700">
                          Guest Live Photo
                        </span>
                        <img
                          src={currentReg.stepData.selfie.url}
                          alt="Guest Selfie"
                          className="mx-auto h-20 w-20 rounded-full border border-gray-200 object-cover"
                        />
                      </div>
                    )}
                    {currentReg.stepData?.signature?.url && (
                      <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                        <span className="mb-1 block text-xs font-bold text-gray-700">
                          Digital Signature
                        </span>
                        <img
                          src={currentReg.stepData.signature.url}
                          alt="Guest Signature"
                          className="mx-auto h-20 w-full rounded-lg border border-gray-100 bg-gray-50 object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Terms and Conditions from DB */}
                {hotel?.termsAndConditions && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-xs text-gray-600">
                    <span className="mb-1 block font-bold text-gray-800">
                      Terms of Stay &amp; Guest Declarations:
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      {hotel.termsAndConditions}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setRejectReason("");
                      setRejectModalOpen(true);
                    }}
                    disabled={rejectMutation.isPending}
                  >
                    Reject Card
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setCorrectionInstructions("");
                      setCorrectionModalOpen(true);
                    }}
                    disabled={correctionMutation.isPending}
                  >
                    Request Correction
                  </Button>
                  <Button
                    variant="primary"
                    icon={CheckCircle2}
                    onClick={() => approveMutation.mutate(currentReg.id)}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending
                      ? "Approving..."
                      : "Approve Registration Card"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && currentReg && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title={`Reject Registration Card — ${currentReg.guestName || "Guest"}`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              Please choose or provide the reason for declining this guest
              registration card:
            </p>
            <div className="space-y-2">
              {[
                "Submitted ID document is illegible or blurry.",
                "Government ID has expired.",
                "Name does not match the reservation details.",
                "Selfie photo does not match identity card.",
              ].map((reason) => (
                <button
                  type="button"
                  key={reason}
                  onClick={() => setRejectReason(reason)}
                  className={`w-full rounded-lg border p-2 text-left text-xs transition ${
                    rejectReason === reason
                      ? "border-rose-500 bg-rose-50 font-semibold text-rose-900"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Rejection Note
              </label>
              <textarea
                className="focus:border-brand-900 w-full rounded-lg border border-gray-200 p-2.5 text-xs text-gray-900 focus:outline-none"
                rows={3}
                placeholder="Explain reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
              <Button
                variant="secondary"
                onClick={() => setRejectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (rejectReason.trim()) {
                    rejectMutation.mutate({
                      id: currentReg.id,
                      reason: rejectReason.trim(),
                    });
                  }
                }}
                loading={rejectMutation.isPending}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Correction Request Modal */}
      {correctionModalOpen && currentReg && (
        <Modal
          isOpen={correctionModalOpen}
          onClose={() => setCorrectionModalOpen(false)}
          title={`Request Correction — ${currentReg.guestName || "Guest"}`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              Select or provide instructions for the guest to resubmit their
              registration card:
            </p>
            <div className="space-y-2">
              {[
                "Please upload a clear, high-resolution photo of your government ID.",
                "Please provide a photo of the reverse side of your ID proof.",
                "Please capture a clear live photo without sunglasses or cap.",
                "Please provide a complete signature on the card.",
              ].map((inst) => (
                <button
                  type="button"
                  key={inst}
                  onClick={() => setCorrectionInstructions(inst)}
                  className={`w-full rounded-lg border p-2 text-left text-xs transition ${
                    correctionInstructions === inst
                      ? "border-amber-500 bg-amber-50 font-semibold text-amber-900"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Correction Instructions
              </label>
              <textarea
                className="focus:border-brand-900 w-full rounded-lg border border-gray-200 p-2.5 text-xs text-gray-900 focus:outline-none"
                rows={3}
                placeholder="Enter specific instructions..."
                value={correctionInstructions}
                onChange={(e) => setCorrectionInstructions(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
              <Button
                variant="secondary"
                onClick={() => setCorrectionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (correctionInstructions.trim()) {
                    correctionMutation.mutate({
                      id: currentReg.id,
                      instructions: correctionInstructions.trim(),
                    });
                  }
                }}
                loading={correctionMutation.isPending}
              >
                Send Instructions
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
