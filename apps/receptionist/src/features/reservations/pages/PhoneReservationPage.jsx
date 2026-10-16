import { useMemo } from "react";
import ReservationWizardLayout from "../components/ReservationWizardLayout.jsx";
import {
  useReservationWizard,
  defaultInitialForm,
} from "../hooks/useReservationWizard.js";
import CallInformationCard from "../components/CallInformationCard.jsx";
import { StayDetailsSection } from "../sections/StayDetailsSection.jsx";
import { RoomTypePicker } from "../sections/RoomTypePicker.jsx";
import { RatePlanPicker } from "../sections/RatePlanPicker.jsx";
import { RoomSelection } from "../sections/RoomSelection.jsx";
import { GuestSection } from "../sections/GuestSection.jsx";
import { AdditionalOptionsSection } from "../sections/AdditionalOptionsSection.jsx";
import { BookingSummary } from "../sections/BookingSummary.jsx";
import { formatDate } from "@hotelos/utils";
import { Phone } from "lucide-react";

const STEPS = [
  { id: "call", title: "Call Information", subtitle: "Caller details & notes" },
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

export default function PhoneReservationPage() {
  const wizard = useReservationWizard({
    source: "PHONE",
    steps: STEPS,
    initialCustomForm: (searchParams) => {
      const base = defaultInitialForm("PHONE", {
        callerName: "",
        callerPhone: "",
        callerPhonePrefix: "+91",
        callTime: new Date().toISOString().slice(0, 16),
        callNotes: "",
        guestMode: "existing",
      });
      if (searchParams.get("roomTypeCode"))
        base.roomTypeCode = searchParams.get("roomTypeCode");
      if (searchParams.get("ratePlanId"))
        base.ratePlanId = searchParams.get("ratePlanId");
      if (searchParams.get("roomId")) {
        base.roomId = searchParams.get("roomId");
        base.preferSpecificRoom = true;
      }
      return base;
    },
    validateCustomStep: (stepId, form) => {
      const errs = {};
      if (stepId === "call") {
        if (!form.callerName?.trim())
          errs.callerName = "Caller name is required";
        if (!form.callerPhone?.trim())
          errs.callerPhone = "Caller phone is required";
      }
      return errs;
    },
    buildCustomPayload: (form, status) => ({
      status,
      source: "PHONE",
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      rooms: form.rooms,
      adults: form.adults,
      children: form.children,
      infants: form.infants,
      purpose: form.purpose,
      guestType: form.guestType,
      specialRequests: form.specialRequests,
      roomTypeCode: form.roomTypeCode,
      ratePlanId: form.ratePlanId || undefined,
      mealPlan: form.mealPlan || undefined,
      rateOverride:
        form.rateOverride !== "" ? Number(form.rateOverride) : undefined,
      roomId: form.preferSpecificRoom ? form.roomId || undefined : undefined,
      name: (form.guest.name || form.callerName || "").trim(),
      phone: `${form.guest.phonePrefix || form.callerPhonePrefix || "+91"}${(form.guest.phone || form.callerPhone || "").trim()}`,
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
        callerName: form.callerName,
        callerPhone: form.callerPhone,
        callTime: form.callTime,
        callNotes: form.callNotes,
      },
    }),
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
      onEdit={() => goToStep(1)}
      onSaveDraft={saveAsDraft}
      onCreate={submitReservation}
      creating={isSubmitting}
      disabled={nights < 1 || !form.roomTypeCode}
    />
  );

  return (
    <ReservationWizardLayout
      title={editId ? "Edit Phone Reservation" : "Phone Reservation"}
      subtitle="Take incoming phone reservations with live caller log and quote"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
          <Phone className="h-3 w-3" />
          Phone Inbound
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
      submitText={
        editId ? "Update Phone Reservation" : "Create Phone Reservation"
      }
      submitError={submitError}
      summaryPanel={summaryPanel}
    >
      {currentStep === 0 && (
        <CallInformationCard
          callerName={form.callerName}
          callerPhone={form.callerPhone}
          callerPhonePrefix={form.callerPhonePrefix}
          callTime={form.callTime}
          callNotes={form.callNotes}
          errors={errors}
          onChange={onFieldChange}
        />
      )}

      {currentStep === 1 && (
        <StayDetailsSection
          value={form}
          onChange={onFieldChange}
          errors={errors}
          lockedSource="PHONE"
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

      {currentStep === 4 && (
        <AdditionalOptionsSection
          form={form}
          onChange={onFieldChange}
          open={true}
        />
      )}

      {currentStep === 5 && (
        <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <h3 className="border-b border-gray-100 pb-3 text-lg font-bold text-gray-900">
            Review Phone Reservation
          </h3>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Call Record
              </span>
              <p className="mt-1 font-semibold text-gray-900">
                {form.callerName}
              </p>
              <p className="text-gray-600">{form.callerPhone}</p>
              {form.callNotes && (
                <p className="mt-2 text-xs text-gray-500 italic">
                  "{form.callNotes}"
                </p>
              )}
            </div>

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
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Guest Profile
              </span>
              <p className="mt-1 font-semibold text-gray-900">
                {form.guest.name || form.callerName}
              </p>
              <p className="text-gray-600">
                {form.guest.phone || form.callerPhone}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {form.guest.email || "No email"}
              </p>
            </div>
          </div>
        </div>
      )}
    </ReservationWizardLayout>
  );
}
