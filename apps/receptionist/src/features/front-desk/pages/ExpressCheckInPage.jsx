import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Header,
  KpiTile,
  KpiTileRow,
  Button,
  InlineBanner,
} from "@hotelos/ui/components";
import { Zap, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { ArrivalsQueue } from "../components/FrontDeskShared.jsx";
import { useQuery, useMutation, useQueryClient } from "@hotelos/query";
import {
  getArrivalsQueue,
  getFrontDeskStats,
  checkInBooking,
} from "@hotelos/api";

export default function ExpressCheckInPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedArrival, setSelectedArrival] = useState(null);
  const [keyCardNumber, setKeyCardNumber] = useState("");
  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerVariant, setBannerVariant] = useState("success");

  // Fetch live express-eligible arrivals
  const { data: arrivalsData, isLoading: arrivalsLoading } = useQuery({
    queryKey: ["front-desk", "arrivals", { expressOnly: "true" }],
    queryFn: () => getArrivalsQueue({ expressOnly: "true" }),
  });

  const { data: statsData } = useQuery({
    queryKey: ["front-desk", "stats"],
    queryFn: () => getFrontDeskStats(),
  });

  const arrivals = arrivalsData || [];
  const stats = statsData || { pendingArrivals: 0, checkedInToday: 0 };
  const currentArrival =
    selectedArrival || (arrivals.length > 0 ? arrivals[0] : null);

  const checkInMutation = useMutation({
    mutationFn: ({ bookingId, data }) => checkInBooking(bookingId, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["front-desk"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["key-cards"] });
      setBannerVariant("success");
      setBannerMsg(res.message || "Express check-in successfully completed!");
      setTimeout(() => {
        navigate("/front-desk/check-out");
      }, 2000);
    },
    onError: (err) => {
      setBannerVariant("error");
      setBannerMsg(err?.message || "Failed to complete express check-in");
    },
  });

  const handleComplete = () => {
    if (!currentArrival?.id) return;
    checkInMutation.mutate({
      bookingId: currentArrival.id,
      data: {
        roomId: currentArrival.roomId,
        keyCardNumber: keyCardNumber || undefined,
        depositAmount: 0,
        notes: "Express Fast-Track check-in verified and completed.",
      },
    });
  };

  return (
    <div className="bg-background-50/50 min-h-screen pb-24">
      <Header
        pageTitle="Express Check-in Fast Track"
        pageDescription="Expedited check-in console with instant digital verification and pre-assigned keys"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900">
          <Zap className="h-3.5 w-3.5 fill-blue-900" /> Express Fast Track
        </span>
      </Header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* KPI Row */}
        <KpiTileRow>
          <KpiTile
            label="Express Arrivals Ready"
            value={arrivals.length}
            icon={Zap}
            iconClassName="bg-brand-50 text-brand-700"
          />
          <KpiTile
            label="Checked In Today"
            value={stats.checkedInToday}
            icon={CheckCircle2}
            iconClassName="bg-emerald-50 text-emerald-700"
          />
          <KpiTile
            label="Total Pending Today"
            value={stats.pendingArrivals}
            icon={Clock}
            iconClassName="bg-amber-50 text-amber-700"
          />
          <KpiTile
            label="Average Turnaround"
            value="< 2 min"
            icon={Clock}
            iconClassName="bg-blue-50 text-blue-700"
          />
          <KpiTile
            label="Fast Track Efficiency"
            value="100%"
            icon={ShieldCheck}
            iconClassName="bg-emerald-50 text-emerald-700"
          />
        </KpiTileRow>

        {bannerMsg && (
          <InlineBanner variant={bannerVariant}>{bannerMsg}</InlineBanner>
        )}

        <div className="grid grid-cols-12 items-start gap-6">
          {/* Left: Queue */}
          <div className="col-span-12 lg:sticky lg:top-24 lg:col-span-4 xl:col-span-4">
            <ArrivalsQueue
              arrivals={arrivals}
              selectedId={currentArrival?.id}
              onSelectArrival={setSelectedArrival}
              onSelect={setSelectedArrival}
              isLoading={arrivalsLoading}
            />
          </div>

          {/* Right: Express Console */}
          <div className="col-span-12 space-y-6 lg:col-span-8 xl:col-span-8">
            {!currentArrival ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-xs">
                <Zap className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-3 text-sm font-bold text-gray-900">
                  No Express Arrivals Waiting
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
                  Guests who complete online digital check-in will automatically
                  appear in this fast track queue.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                  <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900">
                          {currentArrival.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          <ShieldCheck className="h-3 w-3" /> Digital Verified
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-gray-500">
                        Booking:{" "}
                        {currentArrival.bookingNo
                          ? `#${currentArrival.bookingNo}`
                          : "Pending"}{" "}
                        · {currentArrival.phone || "No phone specified"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="block text-xs font-semibold text-gray-500">
                        Assigned Room
                      </span>
                      <span className="text-brand-900 text-base font-bold">
                        {currentArrival.room || "Room Unassigned"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-3 text-xs">
                    <div>
                      <span className="block text-gray-500">ID Document:</span>
                      <strong className="text-gray-800">
                        {currentArrival.idType || "ID Document"} (
                        {currentArrival.idNumber || "Not recorded"})
                      </strong>
                    </div>
                    <div>
                      <span className="block text-gray-500">Stay Dates:</span>
                      <strong className="text-gray-800">
                        {currentArrival.checkIn || "Not set"} to{" "}
                        {currentArrival.checkOut || "Not set"}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-gray-500">
                        Nights & Guests:
                      </span>
                      <strong className="text-gray-800">
                        {currentArrival.nights || 1} Night(s) ·{" "}
                        {currentArrival.guests || 1} Guest(s)
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <label className="font-semibold text-gray-700">
                      Issue Key Card (RFID UID / Number):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. RC-2026-1001"
                        value={keyCardNumber}
                        onChange={(e) => setKeyCardNumber(e.target.value)}
                        className="focus:border-brand-500 flex-1 rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const randomNum = Math.floor(
                            1000 + Math.random() * 9000,
                          );
                          setKeyCardNumber(`RC-2026-${randomNum}`);
                        }}
                        className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                      >
                        Auto Generate
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                  <Button
                    variant="secondary"
                    onClick={() => navigate("/front-desk/check-in")}
                  >
                    Switch to Full Check-in
                  </Button>
                  <Button
                    variant="primary"
                    icon={CheckCircle2}
                    onClick={handleComplete}
                    disabled={checkInMutation.isPending}
                  >
                    {checkInMutation.isPending
                      ? "Confirming..."
                      : "One-Click Express Check-in & Hand Key"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
