import React, { useState } from "react";
import {
  Header,
  KpiTile,
  KpiTileRow,
  Button,
  InlineBanner,
} from "@hotelos/ui/components";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Search,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@hotelos/query";
import {
  getCheckInSessions,
  approveCheckInSession,
  rejectCheckInSession,
  requestCheckInCorrection,
} from "@hotelos/api";

export default function GuestRegistrationCardPage() {
  const queryClient = useQueryClient();
  const [selectedReg, setSelectedReg] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerVariant, setBannerVariant] = useState("success");

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
      setBannerMsg("Registration card approved successfully!");
      setTimeout(() => setBannerMsg(""), 4000);
    },
    onError: (err) => {
      setBannerVariant("error");
      setBannerMsg(err?.message || "Failed to approve registration card");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectCheckInSession(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check-in"] });
      setBannerVariant("error");
      setBannerMsg("Registration card rejected.");
      setTimeout(() => setBannerMsg(""), 4000);
    },
  });

  const correctionMutation = useMutation({
    mutationFn: ({ id, instructions }) =>
      requestCheckInCorrection(id, instructions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check-in"] });
      setBannerVariant("warning");
      setBannerMsg("Correction requested from guest.");
      setTimeout(() => setBannerMsg(""), 4000);
    },
  });

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === "pending" && s.status !== "SUBMITTED") return false;
    if (activeTab === "approved" && s.status !== "APPROVED") return false;
    if (activeTab === "correction" && s.status !== "CORRECTION_REQUESTED")
      return false;
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
                    key={s._id}
                    onClick={() => setSelectedReg(s)}
                    className={`cursor-pointer rounded-xl border p-3 text-xs transition ${
                      currentReg?._id === s._id
                        ? "border-brand-500 bg-brand-50/50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span>{s.reservationId?.guestId?.name || "Guest"}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          s.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : s.status === "SUBMITTED"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-gray-500">
                      {s.reservationId?.reservationNo || "—"} · Room{" "}
                      {s.reservationId?.roomId?.roomNumber || "Unassigned"}
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
                <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {currentReg.reservationId?.guestId?.name || "Guest"}
                    </h3>
                    <p className="mt-0.5 font-mono text-xs text-gray-500">
                      Booking: {currentReg.reservationId?.reservationNo} ·{" "}
                      {currentReg.reservationId?.guestId?.phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs text-gray-500">Status</span>
                    <span className="text-brand-900 text-sm font-bold">
                      {currentReg.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 text-xs sm:grid-cols-3">
                  <div>
                    <span className="block text-gray-500">Nationality</span>
                    <strong className="text-gray-800">
                      {currentReg.reservationId?.guestId?.nationality ||
                        "Indian"}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-gray-500">Check-in</span>
                    <strong className="text-gray-800">
                      {currentReg.reservationId?.checkIn
                        ? new Date(currentReg.reservationId.checkIn)
                            .toISOString()
                            .slice(0, 10)
                        : "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-gray-500">Check-out</span>
                    <strong className="text-gray-800">
                      {currentReg.reservationId?.checkOut
                        ? new Date(currentReg.reservationId.checkOut)
                            .toISOString()
                            .slice(0, 10)
                        : "—"}
                    </strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const reason = prompt("Enter rejection reason:");
                      if (reason)
                        rejectMutation.mutate({ id: currentReg._id, reason });
                    }}
                    disabled={rejectMutation.isPending}
                  >
                    Reject Card
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const instructions = prompt(
                        "Enter correction instructions:",
                      );
                      if (instructions)
                        correctionMutation.mutate({
                          id: currentReg._id,
                          instructions,
                        });
                    }}
                    disabled={correctionMutation.isPending}
                  >
                    Request Correction
                  </Button>
                  <Button
                    variant="primary"
                    icon={CheckCircle2}
                    onClick={() => approveMutation.mutate(currentReg._id)}
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
    </div>
  );
}
