import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Header,
  KpiTile,
  KpiTileRow,
  Button,
  InlineBanner,
} from "@hotelos/ui/components";
import { LogOut, CheckCircle2, Clock, Building, Sparkles } from "lucide-react";
import { DepartureQueue } from "../components/FrontDeskShared.jsx";
import { formatCurrency } from "@hotelos/utils";
import { useQuery, useMutation, useQueryClient } from "@hotelos/query";
import {
  getDeparturesQueue,
  getFrontDeskStats,
  getBookingFolio,
  checkOutBooking,
} from "@hotelos/api";

export default function GuestCheckOutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDeparture, setSelectedDeparture] = useState(null);
  const [settlementMode, setSettlementMode] = useState("CASH");
  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerVariant, setBannerVariant] = useState("success");

  // Fetch live departures
  const { data: departuresData, isLoading: departuresLoading } = useQuery({
    queryKey: ["front-desk", "departures"],
    queryFn: () => getDeparturesQueue(),
  });

  const { data: statsData } = useQuery({
    queryKey: ["front-desk", "stats"],
    queryFn: () => getFrontDeskStats(),
  });

  const departures = departuresData || [];
  const stats = statsData || {
    departuresDue: 0,
    checkedOutToday: 0,
    overstayCount: 0,
  };
  const currentDeparture =
    selectedDeparture || (departures.length > 0 ? departures[0] : null);

  // Fetch live folio charges for the selected departure
  const { data: folioData } = useQuery({
    queryKey: ["front-desk", "folio", currentDeparture?.id],
    queryFn: () => getBookingFolio(currentDeparture.id),
    enabled: Boolean(currentDeparture?.id),
  });

  const folio = folioData || {
    stayCharges: [],
    otherCharges: [],
    stayTariffTotal: currentDeparture?.totalCharges || 0,
    taxes: 0,
    grandTotal: currentDeparture?.totalCharges || 0,
  };

  const checkOutMutation = useMutation({
    mutationFn: ({ bookingId, data }) => checkOutBooking(bookingId, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["front-desk"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["key-cards"] });
      setBannerVariant("success");
      setBannerMsg(
        res.message || "Guest checked out. Turnover cleaning task created.",
      );
      setSelectedDeparture(null);
      setTimeout(() => setBannerMsg(""), 5000);
    },
    onError: (err) => {
      setBannerVariant("error");
      setBannerMsg(err?.message || "Failed to check out guest");
    },
  });

  const handleCloseBooking = () => {
    if (!currentDeparture?.id) return;
    checkOutMutation.mutate({
      bookingId: currentDeparture.id,
      data: {
        settlementMode,
        notes: "Front desk departure settlement completed.",
      },
    });
  };

  return (
    <div className="bg-background-50/50 min-h-screen pb-24">
      <Header
        pageTitle="Guest Check-out"
        pageDescription="Close active guest stays, release room to cleaning, dispatch housekeeping, and settle folio balance"
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* KPI Tiles (5) */}
        <KpiTileRow>
          <KpiTile
            label="Due Today"
            value={stats.departuresDue}
            icon={Clock}
            iconClassName="bg-brand-50 text-brand-700"
          />
          <KpiTile
            label="Checked Out Today"
            value={stats.checkedOutToday}
            icon={CheckCircle2}
            iconClassName="bg-emerald-50 text-emerald-700"
          />
          <KpiTile
            label="Overstay Stays"
            value={stats.overstayCount || 0}
            icon={Clock}
            iconClassName={
              stats.overstayCount > 0
                ? "bg-rose-50 text-rose-700"
                : "bg-blue-50 text-blue-700"
            }
          />
          <KpiTile
            label="Active Checked-in"
            value={departures.length}
            icon={Building}
            iconClassName="bg-purple-50 text-purple-700"
          />
          <KpiTile
            label="Turnover Tasks Active"
            value={stats.checkedOutToday}
            icon={Sparkles}
            iconClassName="bg-amber-50 text-amber-700"
          />
        </KpiTileRow>

        {bannerMsg && (
          <InlineBanner variant={bannerVariant}>{bannerMsg}</InlineBanner>
        )}

        <div className="grid grid-cols-12 items-start gap-6">
          {/* Left: Queue */}
          <div className="col-span-12 lg:sticky lg:top-24 lg:col-span-4">
            <DepartureQueue
              departures={departures}
              selectedId={currentDeparture?.id}
              onSelectDeparture={setSelectedDeparture}
              isLoading={departuresLoading}
            />
          </div>

          {/* Right: Folio & Checkout Console */}
          <div className="col-span-12 space-y-6 lg:col-span-8">
            {!currentDeparture ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-xs">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                <h3 className="mt-3 text-sm font-bold text-gray-900">
                  No Departures Pending
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
                  All active checked-in guests have either checked out or no
                  rooms are due for departure right now.
                </p>
              </div>
            ) : (
              <>
                {/* Guest & Room Details */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                  <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        {currentDeparture.name || "Guest"}
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Booking:{" "}
                        {currentDeparture.bookingNo
                          ? `#${currentDeparture.bookingNo}`
                          : "Pending"}{" "}
                        · {currentDeparture.phone || "No phone specified"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-brand-900 block text-sm font-bold">
                        {currentDeparture.room
                          ? `Room ${currentDeparture.room}`
                          : "Room Unassigned"}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {currentDeparture.roomType || "Standard"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-3 text-xs">
                    <div>
                      <span className="block text-gray-500">Check-in:</span>
                      <strong className="text-gray-800">
                        {currentDeparture.checkIn || "Not specified"}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-gray-500">
                        Scheduled Check-out:
                      </span>
                      <strong className="text-gray-800">
                        {currentDeparture.checkOut || "Not specified"} (
                        {currentDeparture.checkoutTime || "11:00 AM"})
                      </strong>
                    </div>
                    <div>
                      <span className="block text-gray-500">
                        Stay Duration:
                      </span>
                      <strong className="text-gray-800">
                        {currentDeparture.nights || 1} Night(s)
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Folio Charges Breakdown */}
                <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                  <h4 className="text-xs font-bold tracking-wider text-gray-700 uppercase">
                    Folio Billing Summary
                  </h4>

                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-gray-100 bg-gray-50 font-semibold text-gray-600">
                        <tr>
                          <th className="px-3.5 py-2.5">Date</th>
                          <th className="px-3.5 py-2.5">Description</th>
                          <th className="px-3.5 py-2.5">Qty / Units</th>
                          <th className="px-3.5 py-2.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {folio.stayCharges.map((c, i) => (
                          <tr key={c.desc || `sc-${i}`}>
                            <td className="px-3.5 py-2 text-gray-600">
                              {c.date}
                            </td>
                            <td className="px-3.5 py-2 font-medium text-gray-900">
                              {c.desc}
                            </td>
                            <td className="px-3.5 py-2 text-gray-500">
                              {c.qty}
                            </td>
                            <td className="px-3.5 py-2 text-right font-semibold text-gray-900">
                              {formatCurrency(c.amount)}
                            </td>
                          </tr>
                        ))}
                        {folio.otherCharges.map((c, i) => (
                          <tr key={c.desc || `oc-${i}`}>
                            <td className="px-3.5 py-2 text-gray-600">
                              {c.date}
                            </td>
                            <td className="px-3.5 py-2 font-medium text-amber-900">
                              {c.desc}
                            </td>
                            <td className="px-3.5 py-2 text-gray-500">
                              {c.qty}
                            </td>
                            <td className="px-3.5 py-2 text-right font-semibold text-amber-950">
                              {formatCurrency(c.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-brand-50/50 border-brand-100 flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <span className="text-brand-800 block text-xs">
                        Total Outstanding Settlement
                      </span>
                      <span className="text-brand-950 text-lg font-bold">
                        {formatCurrency(folio.grandTotal)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-gray-700">
                        Payment Mode:
                      </label>
                      <select
                        value={settlementMode}
                        onChange={(e) => setSettlementMode(e.target.value)}
                        className="focus:border-brand-500 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium outline-none"
                      >
                        <option value="CASH">Cash</option>
                        <option value="CARD">Credit / Debit Card</option>
                        <option value="UPI">UPI / QR Code</option>
                        <option value="BILL_TO_COMPANY">
                          Bill to Company (Corporate)
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Turnover Actions Confirmation */}
                <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs sm:flex-row">
                  <div className="text-xs text-gray-500">
                    Room <strong>{currentDeparture.room}</strong> will be set to{" "}
                    <span className="font-semibold text-amber-700">
                      Cleaning
                    </span>
                    . Turnover task will be dispatched to Housekeeping.
                  </div>

                  <div className="flex w-full gap-3 sm:w-auto">
                    <Button
                      variant="secondary"
                      onClick={() => navigate("/reservations")}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      icon={LogOut}
                      onClick={handleCloseBooking}
                      disabled={checkOutMutation.isPending}
                    >
                      {checkOutMutation.isPending
                        ? "Closing Stay..."
                        : "Complete Check-out & Settle"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
