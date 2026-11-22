import React, { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
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
  ReservationOverviewCard,
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
  initialRoomId = "",
  onCheckIn,
  isSubmitting,
  onEditGuest,
  onCancel,
}) {
  const guestCount = Math.max(
    1,
    arrival.guests || (arrival.adults || 1) + (arrival.children || 0) || 1,
  );
  const maxDocuments = Math.max(5, 2 * guestCount);

  const targetRoomsCount = Math.max(
    1,
    arrival.roomsCount ||
      arrival.rooms ||
      arrival.roomRequirements?.reduce((sum, r) => sum + (r.rooms || 0), 0) ||
      arrival.roomAllocations?.length ||
      1,
  );

  // Group and partition available clean rooms strictly by booked room types
  const typeBlocks = useMemo(() => {
    if (!arrival) return [];
    let raw = [];
    if (
      Array.isArray(arrival.roomRequirements) &&
      arrival.roomRequirements.length > 0
    ) {
      raw = arrival.roomRequirements.map((r, idx) => ({
        id: `req-${idx}-${String(r.roomTypeCode || "").toLowerCase()}`,
        roomTypeCode: String(r.roomTypeCode || "")
          .toLowerCase()
          .trim(),
        roomTypeName: String(r.roomTypeCode || "").toUpperCase(),
        requiredCount: Number(r.rooms) || 1,
      }));
    } else if (
      Array.isArray(arrival.roomAllocations) &&
      arrival.roomAllocations.length > 0
    ) {
      const typeMap = new Map();
      arrival.roomAllocations.forEach((alloc) => {
        const code = String(
          alloc.roomTypeCode || arrival.roomTypeCode || "standard",
        )
          .toLowerCase()
          .trim();
        typeMap.set(code, (typeMap.get(code) || 0) + 1);
      });
      raw = Array.from(typeMap.entries()).map(([code, count], idx) => ({
        id: `alloc-${idx}-${code}`,
        roomTypeCode: code,
        roomTypeName: code.toUpperCase(),
        requiredCount: count,
      }));
    } else {
      const code = String(arrival.roomTypeCode || "standard")
        .toLowerCase()
        .trim();
      raw = [
        {
          id: `block-0-${code}`,
          roomTypeCode: code,
          roomTypeName: code.toUpperCase(),
          requiredCount: targetRoomsCount,
        },
      ];
    }

    // Filter available clean rooms strictly matching each block's room type
    return raw.map((b) => {
      const availableRooms = cleanRooms.filter((rm) => {
        const rmCode = String(rm.roomCode || "")
          .toLowerCase()
          .trim();
        const rmType = String(rm.type || "")
          .toLowerCase()
          .trim();
        return rmCode === b.roomTypeCode || rmType === b.roomTypeCode;
      });
      return Object.assign({}, b, { availableRooms });
    });
  }, [arrival, cleanRooms, targetRoomsCount]);

  const computeInitialRoomIds = useCallback(() => {
    const selected = [];
    const preAssignedIds = [
      ...(initialRoomId ? [String(initialRoomId)] : []),
      ...(arrival.roomId ? [String(arrival.roomId)] : []),
      ...(arrival.assignedRoomIds || []),
      ...(Array.isArray(arrival.roomAllocations)
        ? arrival.roomAllocations
            .map((a) =>
              a.roomId?._id
                ? String(a.roomId._id)
                : a.roomId
                  ? String(a.roomId)
                  : null,
            )
            .filter(Boolean)
        : []),
    ];
    const preAssignedIdSet = new Set(preAssignedIds);

    for (const block of typeBlocks) {
      const blockSelected = [];
      // 1. Pick pre-assigned rooms for this block
      for (const rm of block.availableRooms) {
        if (blockSelected.length >= block.requiredCount) break;
        if (preAssignedIdSet.has(rm.id) && !selected.includes(rm.id)) {
          blockSelected.push(rm.id);
          selected.push(rm.id);
        }
      }
      // 2. Pick first available clean rooms of this type to fulfill quota
      for (const rm of block.availableRooms) {
        if (blockSelected.length >= block.requiredCount) break;
        if (!selected.includes(rm.id)) {
          blockSelected.push(rm.id);
          selected.push(rm.id);
        }
      }
    }

    return selected;
  }, [arrival, initialRoomId, typeBlocks]);

  const [userSelectedRoomIds, setUserSelectedRoomIds] = useState(null);

  const defaultRoomIds = useMemo(
    () => computeInitialRoomIds(),
    [computeInitialRoomIds],
  );

  const selectedRoomIds = userSelectedRoomIds ?? defaultRoomIds;

  const handleToggleRoom = (roomId, blockId) => {
    const block =
      typeBlocks.find((b) => b.id === blockId) ||
      typeBlocks.find((b) => b.availableRooms.some((r) => r.id === roomId)) ||
      typeBlocks[0];

    if (!block) return;

    const blockRoomIdSet = new Set(block.availableRooms.map((r) => r.id));
    const currentInBlock = selectedRoomIds.filter((id) =>
      blockRoomIdSet.has(id),
    );
    const isAlreadySelected = selectedRoomIds.includes(roomId);

    let next;
    if (isAlreadySelected) {
      next = selectedRoomIds.filter((id) => id !== roomId);
    } else if (currentInBlock.length < block.requiredCount) {
      next = [...selectedRoomIds, roomId];
    } else {
      const lastSelectedInBlock = currentInBlock[currentInBlock.length - 1];
      next = selectedRoomIds.map((id) =>
        id === lastSelectedInBlock ? roomId : id,
      );
    }
    setUserSelectedRoomIds(next);
  };

  const [keyCardNumber, setKeyCardNumber] = useState("");
  const [deposit, setDeposit] = useState(cleanField(arrival.deposit));
  const [documents, setDocuments] = useState(() => {
    if (arrival.documents && arrival.documents.length > 0) {
      return arrival.documents.map((d) => ({
        idType: d.docType || d.idType || "Aadhaar",
        idNumber: d.idNumber || arrival.idNumber || "",
        frontImage: d.frontImage || d.url || null,
        backImage: d.backImage || null,
      }));
    }
    return [
      {
        idType: cleanField(arrival.idType) || "Aadhaar",
        idNumber: cleanField(arrival.idNumber),
        frontImage: null,
        backImage: null,
      },
    ];
  });
  const [isIdVerified, setIsIdVerified] = useState(Boolean(arrival.idVerified));
  const [signatureImage, setSignatureImage] = useState(
    arrival.signatureImage || null,
  );

  const [paymentMode, setPaymentMode] = useState("CASH");

  const isProvisional = arrival.status === "reserved";
  const isDepositDue = arrival.paymentStatus === "unpaid";

  const handleSubmit = () => {
    // Validate each type block quota
    for (const block of typeBlocks) {
      const selectedInBlock = block.availableRooms.filter((r) =>
        selectedRoomIds.includes(r.id),
      );
      if (selectedInBlock.length < block.requiredCount) {
        onCheckIn(
          null,
          `Please select ${block.requiredCount} ${block.roomTypeName} room(s) (${selectedInBlock.length}/${block.requiredCount} selected).`,
        );
        return;
      }
    }

    if (selectedRoomIds.length < targetRoomsCount) {
      onCheckIn(
        null,
        `Please select all ${targetRoomsCount} rooms for this reservation (${selectedRoomIds.length}/${targetRoomsCount} selected).`,
      );
      return;
    }

    onCheckIn({
      roomId: selectedRoomIds[0],
      roomIds: selectedRoomIds,
      keyCardNumber: keyCardNumber || undefined,
      depositAmount: Number(deposit) || 0,
      paymentMode,
      notes: isProvisional
        ? "Provisional hold reconfirmed and checked in at Front Desk."
        : "Front desk manual check-in verification completed.",
      idType: documents[0]?.idType || "Aadhaar",
      idNumber: documents[0]?.idNumber || "",
      documents,
      isIdVerified,
      signatureImage,
    });
  };

  const assignedRoomNumbers = cleanRooms
    .filter((r) => selectedRoomIds.includes(r.id))
    .map((r) => `Room ${r.roomNumber}`);

  const assignedRoomDisplay =
    assignedRoomNumbers.length > 0
      ? assignedRoomNumbers.join(", ")
      : arrival.room || "Unassigned";

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

      {/* 1. Full Reservation Overview Card */}
      <ReservationOverviewCard arrival={arrival} onEditClick={onEditGuest} />

      {/* 2. Identity Verification Console */}
      <IdVerificationConsole
        documents={documents}
        onDocumentsChange={setDocuments}
        isVerified={isIdVerified}
        onToggleVerified={setIsIdVerified}
        maxDocuments={maxDocuments}
        guestCount={guestCount}
      />

      {/* 3. Type-Filtered Room Assignment Selector */}
      <CleanRoomSelector
        typeBlocks={typeBlocks}
        selectedRoomIds={selectedRoomIds}
        onToggleRoom={handleToggleRoom}
        targetRoomsCount={targetRoomsCount}
      />

      {/* 4. Key Card Number Assignment Input */}
      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-700 uppercase">
          <Key className="text-brand-600 h-4 w-4" />
          <span>
            {targetRoomsCount > 1
              ? `Issue RFID Key Cards (${targetRoomsCount} Rooms)`
              : "Issue RFID Key Card (Optional)"}
          </span>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder={
              targetRoomsCount > 1
                ? "e.g. RC-1001, RC-1002 (comma-separated)"
                : "e.g. RC-2026-1001"
            }
            value={keyCardNumber}
            onChange={(e) => setKeyCardNumber(e.target.value)}
            className="focus:border-brand-500 w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (targetRoomsCount > 1 && selectedRoomIds.length > 0) {
                const cards = selectedRoomIds.map(
                  () => `RC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                );
                setKeyCardNumber(cards.join(", "));
              } else {
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                setKeyCardNumber(`RC-2026-${randomNum}`);
              }
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
          Room(s) assigned:{" "}
          <strong className="text-gray-900">{assignedRoomDisplay}</strong>
          {targetRoomsCount > 1 && (
            <span
              className={`ml-2 inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                selectedRoomIds.length === targetRoomsCount
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              {selectedRoomIds.length}/{targetRoomsCount} Selected
            </span>
          )}
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

const EMPTY_ARRIVALS = [];

export default function FrontDeskCheckInPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const urlBookingId = searchParams.get("bookingId");
  const urlRoomId = searchParams.get("roomId");
  const urlGuest = searchParams.get("guest");

  const [selectedArrivalId, setSelectedArrivalId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerVariant, setBannerVariant] = useState("success");

  // Fetch live arrivals queue (passing bookingId if provided to guarantee it's in the queue)
  const { data: arrivalsData, isLoading: arrivalsLoading } = useQuery({
    queryKey: [
      "front-desk",
      "arrivals",
      { bookingId: urlBookingId || undefined },
    ],
    queryFn: () =>
      getArrivalsQueue(urlBookingId ? { bookingId: urlBookingId } : {}),
  });

  // Fetch all clean/available rooms
  const { data: roomsData } = useQuery({
    queryKey: ["rooms", "all"],
    queryFn: () => getRooms(),
  });

  // Fetch live front desk operational stats
  const { data: statsData } = useQuery({
    queryKey: ["front-desk", "stats"],
    queryFn: () => getFrontDeskStats(),
  });

  const arrivals = arrivalsData || EMPTY_ARRIVALS;

  // Resolve current arrival based on selectedArrivalId, urlBookingId, urlRoomId, urlGuest, or fallback to first
  const currentArrival = useMemo(() => {
    if (!arrivals || arrivals.length === 0) return null;

    const targetId = selectedArrivalId || urlBookingId;

    if (targetId) {
      const match = arrivals.find(
        (a) =>
          String(a.id) === String(targetId) ||
          String(a._id) === String(targetId) ||
          String(a.bookingNo) === String(targetId),
      );
      if (match) return match;
    }

    if (urlRoomId) {
      const match = arrivals.find(
        (a) =>
          String(a.roomId) === String(urlRoomId) ||
          String(a.roomId?._id) === String(urlRoomId),
      );
      if (match) return match;
    }

    if (urlGuest) {
      const targetGuest = urlGuest.trim().toLowerCase();
      const match = arrivals.find(
        (a) => a.name?.trim().toLowerCase() === targetGuest,
      );
      if (match) return match;
    }

    return arrivals[0] || null;
  }, [arrivals, selectedArrivalId, urlBookingId, urlRoomId, urlGuest]);

  const assignedRoomIds = useMemo(() => {
    if (!currentArrival) return [];
    const ids = [];
    if (currentArrival.roomId) ids.push(String(currentArrival.roomId));
    if (Array.isArray(currentArrival.assignedRoomIds)) {
      currentArrival.assignedRoomIds.forEach((id) => ids.push(String(id)));
    }
    if (Array.isArray(currentArrival.roomAllocations)) {
      currentArrival.roomAllocations.forEach((a) => {
        const rId = a.roomId?._id || a.roomId;
        if (rId) ids.push(String(rId));
      });
    }
    return Array.from(new Set(ids));
  }, [currentArrival]);

  // Map clean vacant rooms + rooms already assigned to this booking
  const cleanRooms = useMemo(() => {
    const rawList = Array.isArray(roomsData?.rooms)
      ? roomsData.rooms
      : Array.isArray(roomsData)
        ? roomsData
        : [];

    return rawList
      .filter((r) => {
        const id = String(r.id || r._id);
        const isAssignedToThisArrival = assignedRoomIds.includes(id);
        const isAvailable = !r.status || r.status === "available";
        return isAvailable || isAssignedToThisArrival;
      })
      .map((r) => {
        const id = String(r.id || r._id);
        const isAssignedToThisArrival = assignedRoomIds.includes(id);
        return {
          id,
          roomNumber: String(r.roomNumber),
          floor: r.floor || 1,
          view: r.type || "Standard",
          type: r.type || "Standard",
          roomCode: String(r.roomCode || r.type || "").toLowerCase(),
          rate: r.rate || 0,
          status: r.status || "available",
          isPreAssigned: isAssignedToThisArrival,
        };
      });
  }, [roomsData, assignedRoomIds]);

  const stats = statsData || {
    pendingArrivals: 0,
    checkedInToday: 0,
    departuresDue: 0,
    checkedOutToday: 0,
    activeKeysCount: 0,
    overstayCount: 0,
  };

  const handleSelectArrival = (arr) => {
    if (!arr) return;
    setSelectedArrivalId(arr.id);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("bookingId", arr.id);
        if (arr.roomId) next.set("roomId", arr.roomId);
        else next.delete("roomId");
        if (arr.name) next.set("guest", arr.name);
        return next;
      },
      { replace: true },
    );
  };

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
              onSelectArrival={handleSelectArrival}
              onSelect={handleSelectArrival}
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
                initialRoomId={urlRoomId || ""}
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
