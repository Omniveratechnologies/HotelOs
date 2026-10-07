import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Header,
  KpiTile,
  KpiTileRow,
  Button,
  InlineBanner,
} from "@hotelos/ui/components";
import { Users, CheckCircle2, Clock, Key, ArrowRight } from "lucide-react";
import {
  ArrivalsQueue,
  GuestDetailsCard,
  IdVerificationConsole,
  CleanRoomSelector,
  ChargesDepositCard,
  SignatureCaptureBox,
} from "../components/FrontDeskShared.jsx";
import EditGuestModal from "../components/EditGuestModal.jsx";
import { useQuery, useMutation, useQueryClient } from "@hotelos/query";
import {
  getArrivalsQueue,
  getFrontDeskStats,
  checkInBooking,
  getRooms,
  updateGuest,
  updateBooking,
} from "@hotelos/api";

function cleanField(val) {
  if (!val || val === "—" || val === "null" || val === "undefined") return "";
  return String(val);
}

function CheckInForm({
  arrival,
  cleanRooms,
  onCheckIn,
  isSubmitting,
  onEditGuest,
  onCancel,
}) {
  const [selectedRoomId, setSelectedRoomId] = useState(arrival.roomId || "");
  const [keyCardNumber, setKeyCardNumber] = useState("");
  const [deposit, setDeposit] = useState(cleanField(arrival.deposit));
  const [idType, setIdType] = useState(cleanField(arrival.idType) || "Aadhaar");
  const [idNumber, setIdNumber] = useState(cleanField(arrival.idNumber));
  const [idFrontImage, setIdFrontImage] = useState(
    arrival.idFrontImage || null,
  );
  const [idBackImage, setIdBackImage] = useState(arrival.idBackImage || null);
  const [isIdVerified, setIsIdVerified] = useState(Boolean(arrival.idVerified));
  const [signatureImage, setSignatureImage] = useState(
    arrival.signatureImage || null,
  );

  const [paymentMode, setPaymentMode] = useState("CASH");

  const isProvisional = arrival.status === "reserved";
  const isDepositDue = arrival.paymentStatus === "unpaid";

  const handleSubmit = () => {
    const assignedRoom = selectedRoomId || arrival.roomId;
    if (!assignedRoom) {
      onCheckIn(null, "Please select a clean room before completing check-in.");
      return;
    }

    onCheckIn({
      roomId: assignedRoom,
      keyCardNumber: keyCardNumber || undefined,
      depositAmount: Number(deposit) || 0,
      paymentMode,
      notes: isProvisional
        ? "Provisional hold reconfirmed and checked in at Front Desk."
        : "Front desk manual check-in verification completed.",
      idType,
      idNumber,
      isIdVerified,
      signatureImage,
    });
  };

  const assignedRoomDisplay =
    cleanRooms.find((r) => r.id === (selectedRoomId || arrival.roomId))
      ?.roomNumber ||
    arrival.room ||
    "Unassigned";

  return (
    <>
      {/* Notice Banner for Provisional Hold Bookings */}
      {isProvisional && (
        <InlineBanner variant="warning">
          <strong>Provisional Hold Reservation:</strong> This booking is on
          tentative hold. Please collect an advance deposit or full stay tariff
          to confirm and guarantee the stay before issuing the room key.
        </InlineBanner>
      )}

      {/* 1. Guest Profile Details with Edit Option */}
      <GuestDetailsCard guest={arrival} onEditClick={onEditGuest} />

      {/* 2. Identity Verification Console */}
      <IdVerificationConsole
        idType={idType}
        onIdTypeChange={setIdType}
        idNumber={idNumber}
        onIdNumberChange={setIdNumber}
        frontImage={idFrontImage}
        onFrontImageChange={setIdFrontImage}
        backImage={idBackImage}
        onBackImageChange={setIdBackImage}
        isVerified={isIdVerified}
        onToggleVerified={setIsIdVerified}
      />

      {/* 3. Room Assignment Selector */}
      <CleanRoomSelector
        rooms={cleanRooms}
        selectedRoomId={selectedRoomId || arrival.roomId}
        onSelectRoom={(id) => setSelectedRoomId(id)}
      />

      {/* 4. Key Card Number Assignment Input */}
      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-700 uppercase">
          <Key className="text-brand-600 h-4 w-4" />
          <span>Issue RFID Key Card (Optional)</span>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="e.g. RC-2026-1001"
            value={keyCardNumber}
            onChange={(e) => setKeyCardNumber(e.target.value)}
            className="focus:border-brand-500 w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              const randomNum = Math.floor(1000 + Math.random() * 9000);
              setKeyCardNumber(`RC-2026-${randomNum}`);
            }}
            className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold whitespace-nowrap text-gray-700 hover:bg-gray-200"
          >
            Scan / Auto-Key
          </button>
        </div>
      </div>

      {/* 5. Charges & Deposit Capture */}
      <ChargesDepositCard
        guest={arrival}
        depositAmount={deposit}
        onDepositChange={(val) => setDeposit(val)}
        paymentMode={paymentMode}
        onPaymentModeChange={setPaymentMode}
      />

      {/* 6. Guest Signature Upload */}
      <SignatureCaptureBox
        signatureImage={signatureImage}
        onSignatureChange={setSignatureImage}
        guestName={arrival.name}
      />

      {/* Action Bar */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs sm:flex-row">
        <div className="text-xs text-gray-500">
          Room assigned:{" "}
          <strong className="text-gray-900">{assignedRoomDisplay}</strong>
          {isProvisional && (
            <span className="ml-2 inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">
              Hold will be confirmed upon check-in
            </span>
          )}
        </div>
        <div className="flex w-full gap-3 sm:w-auto">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={CheckCircle2}
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={
              isProvisional || isDepositDue
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : ""
            }
          >
            {isSubmitting
              ? "Checking In..."
              : isProvisional
                ? "Confirm & Complete Check-in"
                : isDepositDue
                  ? "Collect Deposit & Check In"
                  : "Complete Check-in & Assign Key"}
          </Button>
        </div>
      </div>
    </>
  );
}

export default function FrontDeskCheckInPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedArrivalId, setSelectedArrivalId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerVariant, setBannerVariant] = useState("success");

  // Fetch live arrivals queue
  const { data: arrivalsData, isLoading: arrivalsLoading } = useQuery({
    queryKey: ["front-desk", "arrivals"],
    queryFn: () => getArrivalsQueue(),
  });

  // Fetch available clean rooms
  const { data: roomsData } = useQuery({
    queryKey: ["rooms", "clean-available"],
    queryFn: () => getRooms({ status: "available" }),
  });

  // Fetch live front desk operational stats
  const { data: statsData } = useQuery({
    queryKey: ["front-desk", "stats"],
    queryFn: () => getFrontDeskStats(),
  });

  const arrivals = arrivalsData || [];
  const cleanRooms = (roomsData?.rooms || roomsData || []).map((r) => ({
    id: r._id,
    roomNumber: String(r.roomNumber),
    floor: r.floor || 1,
    view: r.type || "City View",
  }));
  const stats = statsData || {
    pendingArrivals: 0,
    checkedInToday: 0,
    departuresDue: 0,
    checkedOutToday: 0,
    activeKeysCount: 0,
    overstayCount: 0,
  };

  // Resolve current arrival
  const currentArrival =
    (selectedArrivalId
      ? arrivals.find((a) => a.id === selectedArrivalId)
      : null) || (arrivals.length > 0 ? arrivals[0] : null);

  const handleSaveGuest = async (updatedData) => {
    if (!currentArrival) return;
    if (currentArrival.guestId) {
      await updateGuest(currentArrival.guestId, {
        name: updatedData.name,
        phone: updatedData.phone,
        email: updatedData.email,
        nationality: updatedData.nationality,
        address: updatedData.address,
      });
    }
    if (updatedData.specialRequests !== currentArrival.specialRequests) {
      await updateBooking(currentArrival.id, {
        specialRequests: updatedData.specialRequests,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["front-desk"] });
    setBannerVariant("success");
    setBannerMsg("Guest profile updated successfully!");
    setTimeout(() => setBannerMsg(""), 4000);
  };

  const checkInMutation = useMutation({
    mutationFn: ({ bookingId, data }) => checkInBooking(bookingId, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["front-desk"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["key-cards"] });
      setBannerVariant("success");
      setBannerMsg(res.message || "Guest checked in successfully!");
      setTimeout(() => {
        navigate("/front-desk/check-out");
      }, 2000);
    },
    onError: (err) => {
      setBannerVariant("error");
      setBannerMsg(
        err?.message || "Check-in failed. Please verify room assignment.",
      );
    },
  });

  const handleCheckIn = (data, errorMsg) => {
    if (errorMsg) {
      setBannerVariant("error");
      setBannerMsg(errorMsg);
      return;
    }
    if (!currentArrival?.id) return;
    checkInMutation.mutate({
      bookingId: currentArrival.id,
      data,
    });
  };

  return (
    <div className="bg-background-50/50 min-h-screen pb-24">
      <Header
        pageTitle="Front Desk — Check In"
        pageDescription="Manage live guest arrivals, verify ID details, assign rooms and complete check-in"
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* KPI Tiles (6) */}
        <KpiTileRow>
          <KpiTile
            label="Expected Today"
            value={stats.pendingArrivals + stats.checkedInToday}
            icon={Users}
            iconClassName="bg-brand-50 text-brand-700"
          />
          <KpiTile
            label="Checked In"
            value={stats.checkedInToday}
            icon={CheckCircle2}
            iconClassName="bg-emerald-50 text-emerald-700"
          />
          <KpiTile
            label="Pending Check-in"
            value={stats.pendingArrivals}
            icon={Clock}
            iconClassName="bg-amber-50 text-amber-700"
          />
          <KpiTile
            label="Departures Due"
            value={stats.departuresDue}
            icon={ArrowRight}
            iconClassName="bg-blue-50 text-blue-700"
          />
          <KpiTile
            label="Checked Out Today"
            value={stats.checkedOutToday}
            icon={CheckCircle2}
            iconClassName="bg-emerald-50 text-emerald-700"
          />
          <KpiTile
            label="Active Key Cards"
            value={stats.activeKeysCount}
            icon={Key}
            iconClassName="bg-purple-50 text-purple-700"
          />
        </KpiTileRow>

        {bannerMsg && (
          <InlineBanner variant={bannerVariant}>{bannerMsg}</InlineBanner>
        )}

        {/* 2-Column Operational Grid */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Left Column: Arrivals Queue (4 cols) - Sticky & Self-scrollable */}
          <div className="lg:sticky lg:top-24 lg:col-span-4">
            <ArrivalsQueue
              arrivals={arrivals}
              selectedId={currentArrival?.id}
              onSelectArrival={(arr) => setSelectedArrivalId(arr.id)}
              onSelect={(arr) => setSelectedArrivalId(arr.id)}
              isLoading={arrivalsLoading}
            />
          </div>

          {/* Right Column: Check-in Execution Console (8 cols) */}
          <div className="space-y-6 lg:col-span-8">
            {!currentArrival ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-xs">
                <Users className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-3 text-sm font-bold text-gray-900">
                  No Pending Arrivals
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
                  All expected guests for today have been checked in or no
                  bookings are scheduled for today.
                </p>
              </div>
            ) : (
              <CheckInForm
                key={currentArrival.id}
                arrival={currentArrival}
                cleanRooms={cleanRooms}
                onCheckIn={handleCheckIn}
                isSubmitting={checkInMutation.isPending}
                onEditGuest={() => setIsEditModalOpen(true)}
                onCancel={() => navigate("/reservations")}
              />
            )}
          </div>
        </div>
      </div>

      <EditGuestModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        guest={currentArrival}
        onSave={handleSaveGuest}
      />
    </div>
  );
}
