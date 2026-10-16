import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import ReservationWizardLayout from "../components/ReservationWizardLayout.jsx";
import {
  useReservationWizard,
  defaultInitialForm,
} from "../hooks/useReservationWizard.js";
import {
  RepeatGuestSearchPane,
  RepeatGuestHistoryPanel,
} from "../components/RepeatGuestComponents.jsx";
import { StayDetailsSection } from "../sections/StayDetailsSection.jsx";
import { RoomTypePicker } from "../sections/RoomTypePicker.jsx";
import { RatePlanPicker } from "../sections/RatePlanPicker.jsx";
import { RoomSelection } from "../sections/RoomSelection.jsx";
import { AdditionalOptionsSection } from "../sections/AdditionalOptionsSection.jsx";
import { BookingSummary } from "../sections/BookingSummary.jsx";
import { searchGuests } from "@hotelos/api";
import { formatDate } from "@hotelos/utils";
import { Crown } from "lucide-react";

const STEPS = [
  { id: "guest", title: "Select Guest", subtitle: "Profile & preferences" },
  { id: "stay", title: "Stay Details", subtitle: "Dates, guests & purpose" },
  { id: "room", title: "Select Room & Rate", subtitle: "History suggested" },
  { id: "options", title: "Add-ons & Extras", subtitle: "Saved amenities" },
  { id: "confirm", title: "Review & Confirm", subtitle: "Review booking" },
];

export default function RepeatGuestPage() {
  const [searchParams] = useSearchParams();
  const guestIdQuery = searchParams.get("guestId");
  const phoneQuery = searchParams.get("phone");
  const [selectedGuest, setSelectedGuest] = useState(null);

  const wizard = useReservationWizard({
    source: "REPEAT_GUEST",
    steps: STEPS,
    initialCustomForm: () =>
      defaultInitialForm("REPEAT_GUEST", {
        guestMode: "existing",
        specialRequests:
          "Same preferences as previous stay: high floor, non-smoking",
      }),
    validateCustomStep: (stepId, form) => {
      const errs = {};
      if (stepId === "guest") {
        if (!form.guest?.name?.trim()) {
          errs["guest.name"] =
            "Please select a returning guest from the profile list";
        }
      }
      return errs;
    },
    buildCustomPayload: (form, status) => ({
      status,
      source: "REPEAT_GUEST",
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      rooms: form.rooms,
      adults: form.adults,
      children: form.children,
      infants: form.infants,
      purpose: form.purpose || "Returning Guest Stay",
      guestType: "individual",
      specialRequests: form.specialRequests,
      roomTypeCode: form.roomTypeCode,
      ratePlanId: form.ratePlanId || undefined,
      mealPlan: form.mealPlan || undefined,
      rateOverride:
        form.rateOverride !== "" ? Number(form.rateOverride) : undefined,
      roomId: form.preferSpecificRoom ? form.roomId || undefined : undefined,
      name: form.guest.name.trim(),
      phone: `${form.guest.phonePrefix || "+91"}${form.guest.phone.trim()}`,
      email: form.guest.email?.trim() || undefined,
      nationality: form.guest.nationality || undefined,
      idType: form.guest.idType || undefined,
      idNumber: form.guest.idNumber?.trim() || undefined,
      addOns: form.addOns,
      discount:
        form.discount && Number(form.discount) > 0
          ? { type: "percent", value: Number(form.discount) }
          : undefined,
      metadata: {
        repeatGuestId: selectedGuest?.id,
        loyaltyTier: selectedGuest?.tier,
        loyaltyPoints: selectedGuest?.points,
        preferences: selectedGuest?.preferences,
      },
    }),
  });

  const {
    editId,
    form,
    onFieldChange,
    onSelectExistingGuest,
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    errors,
    submitError,
    nights,
    typeItems,
    ratePlanOptions,
    typesLoading,
    roomsLoading,
    availableRooms,
    quote,
    saveAsDraft,
    submitReservation,
    isSubmitting,
    navigate,
  } = wizard;

  const handleGuestSelect = (g) => {
    setSelectedGuest(g);
    onSelectExistingGuest({
      name: g.name,
      phone: g.phone.replace("+91", "").trim(),
      phonePrefix: "+91",
      email: g.email,
      nationality: g.nationality,
      idType: g.idType,
      idNumber: g.idNumber,
    });
    if (g.preferredRoomType) {
      onFieldChange("roomTypeCode", g.preferredRoomType);
    }
  };

  useEffect(() => {
    if (!selectedGuest && (guestIdQuery || phoneQuery)) {
      searchGuests(phoneQuery || "")
        .then((list) => {
          const found =
            (list || []).find(
              (g) => g.id === guestIdQuery || g._id === guestIdQuery,
            ) || list?.[0];
          if (found) {
            handleGuestSelect(found);
          }
        })
        .catch(() => {});
    }
  }, [guestIdQuery, phoneQuery]);

  const currentType = useMemo(
    () => typeItems.find((t) => t.roomTypeCode === form.roomTypeCode),
    [typeItems, form.roomTypeCode],
  );

  const media = useMemo(
    () => ({
      roomTypeName: currentType?.name || form.roomTypeCode || "Not selected",
      guestsLine: `${form.rooms} Room${form.rooms > 1 ? "s" : ""}, ${form.adults} Adult${form.adults > 1 ? "s" : ""}`,
      datesLine:
        form.checkIn && form.checkOut
          ? `${formatDate(form.checkIn)} → ${formatDate(form.checkOut)} (${nights} night${nights === 1 ? "" : "s"})`
          : "Dates pending",
    }),
    [
      currentType,
      form.roomTypeCode,
      form.rooms,
      form.adults,
      form.checkIn,
      form.checkOut,
      nights,
    ],
  );

  const summaryPanel = (
    <div className="space-y-4">
      {selectedGuest && (
        <RepeatGuestHistoryPanel selectedGuest={selectedGuest} />
      )}
      <BookingSummary
        quote={quote.data}
        quoteLoading={quote.isPending}
        media={media}
        editMode={Boolean(editId)}
        onEdit={() => goToStep(1)}
        onSaveDraft={saveAsDraft}
        onCreate={submitReservation}
        creating={isSubmitting}
        disabled={nights < 1 || !form.roomTypeCode}
      />
    </div>
  );

  return (
    <ReservationWizardLayout
      title={editId ? "Edit Repeat Guest Booking" : "Repeat Guest Booking"}
      subtitle="Fast booking for returning guests with auto-populated profile and past preferences"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
          <Crown className="h-3 w-3" />
          Loyalty Member
        </span>
      }
      steps={STEPS}
      currentStep={currentStep}
      onStepClick={goToStep}
      onBack={() => navigate("/reservations")}
      onPrevStep={prevStep}
      onNextStep={nextStep}
      onSaveDraft={saveAsDraft}
      onSubmit={submitReservation}
      isSubmitting={isSubmitting}
      submitText={editId ? "Update Booking" : "Create Repeat Guest Booking"}
      submitError={submitError}
      summaryPanel={summaryPanel}
    >
      {currentStep === 0 && (
        <RepeatGuestSearchPane
          searchQuery={form.guestQuery}
          onSearchChange={(q) => onFieldChange("guestQuery", q)}
          selectedGuest={selectedGuest}
          onSelectGuest={handleGuestSelect}
          error={errors["guest.name"]}
        />
      )}

      {currentStep === 1 && (
        <StayDetailsSection
          value={form}
          onChange={onFieldChange}
          errors={errors}
          lockedSource="REPEAT_GUEST"
          open={true}
        />
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <RoomTypePicker
            items={typeItems}
            value={form.roomTypeCode}
            onSelect={(code) => {
              onFieldChange("roomTypeCode", code);
              onFieldChange("ratePlanId", "");
              onFieldChange("roomId", "");
            }}
            range={{ checkIn: form.checkIn, checkOut: form.checkOut, nights }}
            loading={typesLoading}
            open={true}
          />

          {form.roomTypeCode && (
            <RatePlanPicker
              plans={ratePlanOptions}
              value={form.ratePlanId}
              onSelect={(pid) => onFieldChange("ratePlanId", pid)}
              roomTypeName={currentType?.name || form.roomTypeCode}
              open={true}
            />
          )}

          {form.roomTypeCode && (
            <RoomSelection
              roomTypeCode={form.roomTypeCode}
              rooms={availableRooms}
              selectedRoomId={form.roomId}
              preferSpecificRoom={form.preferSpecificRoom}
              onPreferSpecificRoomChange={(prefer) =>
                onFieldChange("preferSpecificRoom", prefer)
              }
              onSelectRoom={(rid) => onFieldChange("roomId", rid)}
              loading={roomsLoading}
              error={errors.roomId}
              open={true}
            />
          )}
        </div>
      )}

      {currentStep === 3 && (
        <AdditionalOptionsSection
          form={form}
          onChange={onFieldChange}
          open={true}
        />
      )}

      {currentStep === 4 && (
        <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <h3 className="border-b border-gray-100 pb-3 text-lg font-bold text-gray-900">
            Review Repeat Guest Booking
          </h3>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <span className="text-xs font-semibold text-amber-800 uppercase">
                Guest Profile
              </span>
              <p className="mt-1 font-semibold text-gray-900">
                {form.guest.name || "—"}
              </p>
              <p className="text-gray-600">{form.guest.phone || "—"}</p>
              <p className="mt-1 text-xs text-gray-500">
                Tier: {selectedGuest?.tier || "Regular"}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Stay Period
              </span>
              <p className="mt-1 font-semibold text-gray-900">
                {form.checkIn} → {form.checkOut} ({nights} nights)
              </p>
              <p className="text-gray-600">
                {form.rooms} Room(s), {form.adults} Adult(s)
              </p>
            </div>
          </div>
        </div>
      )}
    </ReservationWizardLayout>
  );
}
