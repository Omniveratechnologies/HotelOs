import { useMemo } from "react";
import ReservationWizardLayout from "../components/ReservationWizardLayout.jsx";
import { useReservationWizard } from "../hooks/useReservationWizard.js";
import { StayDetailsSection } from "../sections/StayDetailsSection.jsx";
import { RoomTypePicker } from "../sections/RoomTypePicker.jsx";
import { RatePlanPicker } from "../sections/RatePlanPicker.jsx";
import { RoomSelection } from "../sections/RoomSelection.jsx";
import { GuestSection } from "../sections/GuestSection.jsx";
import { AdditionalOptionsSection } from "../sections/AdditionalOptionsSection.jsx";
import { BookingSummary } from "../sections/BookingSummary.jsx";
import { formatDate } from "@hotelos/utils";

const STEPS = [
  { id: "stay", title: "Stay Details", subtitle: "Dates, guests, purpose" },
  { id: "room", title: "Select Room", subtitle: "Room type & rate" },
  { id: "guest", title: "Guest Details", subtitle: "Contact & ID" },
  {
    id: "options",
    title: "Additional Options",
    subtitle: "Add-ons & requests",
  },
  { id: "confirm", title: "Confirm & Create", subtitle: "Review booking" },
];

export default function NewReservationPage() {
  const wizard = useReservationWizard({
    source: "DIRECT",
    steps: STEPS,
  });

  const {
    editId,
    form,
    onFieldChange,
    onGuestField,
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
    guestSearch,
    saveAsDraft,
    submitReservation,
    isSubmitting,
    navigate,
  } = wizard;

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
    <BookingSummary
      quote={quote.data}
      quoteLoading={quote.isPending}
      media={media}
      editMode={Boolean(editId)}
      onEdit={() => goToStep(0)}
      onSaveDraft={saveAsDraft}
      onCreate={submitReservation}
      creating={isSubmitting}
      disabled={nights < 1 || !form.roomTypeCode}
    />
  );

  return (
    <ReservationWizardLayout
      title={editId ? "Edit Reservation" : "New Reservation"}
      subtitle="Direct front desk reservation booking with real-time room holds and rate calculation"
      steps={STEPS}
      currentStep={currentStep}
      onStepClick={goToStep}
      onBack={() => navigate("/reservations")}
      onPrevStep={prevStep}
      onNextStep={nextStep}
      onSaveDraft={saveAsDraft}
      onSubmit={submitReservation}
      isSubmitting={isSubmitting}
      submitText={editId ? "Update Reservation" : "Create Reservation"}
      submitError={submitError}
      summaryPanel={summaryPanel}
    >
      {currentStep === 0 && (
        <StayDetailsSection
          value={form}
          onChange={onFieldChange}
          errors={errors}
          open={true}
        />
      )}

      {currentStep === 1 && (
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

      {currentStep === 2 && (
        <GuestSection
          mode={form.guestMode}
          onModeChange={(m) => onFieldChange("guestMode", m)}
          form={form.guest}
          onField={onGuestField}
          errors={errors}
          searchQuery={form.guestQuery}
          onSearchChange={(q) => onFieldChange("guestQuery", q)}
          searchResults={guestSearch.results}
          onSelectGuest={onSelectExistingGuest}
          searching={guestSearch.isLoading}
          open={true}
        />
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
            Review Booking Details
          </h3>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Stay Details
              </span>
              <p className="mt-1 font-semibold text-gray-900">
                {form.checkIn} → {form.checkOut} ({nights} nights)
              </p>
              <p className="text-gray-600">
                {form.rooms} Room(s), {form.adults} Adult(s)
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Source: {form.source}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Primary Guest
              </span>
              <p className="mt-1 font-semibold text-gray-900">
                {form.guest.name || "—"}
              </p>
              <p className="text-gray-600">{form.guest.phone || "—"}</p>
              <p className="mt-1 text-xs text-gray-500">
                {form.guest.email || "No email provided"}
              </p>
            </div>
          </div>
        </div>
      )}
    </ReservationWizardLayout>
  );
}
