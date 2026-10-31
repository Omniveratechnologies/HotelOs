import { useMemo } from "react";
import ReservationWizardLayout from "../components/ReservationWizardLayout.jsx";
import {
  useReservationWizard,
  defaultInitialForm,
} from "../hooks/useReservationWizard.js";
import {
  WebsiteRegistrationBanner,
  WebsiteGuestCard,
} from "../components/WebsiteComponents.jsx";
import { StayDetailsSection } from "../sections/StayDetailsSection.jsx";
import { RoomTypePicker } from "../sections/RoomTypePicker.jsx";
import { RatePlanPicker } from "../sections/RatePlanPicker.jsx";
import { RoomSelection } from "../sections/RoomSelection.jsx";
import { GuestSection } from "../sections/GuestSection.jsx";
import { AdditionalOptionsSection } from "../sections/AdditionalOptionsSection.jsx";
import { BookingSummary } from "../sections/BookingSummary.jsx";
import { RoomRequirementsMatrix } from "../components/RoomRequirementsMatrix.jsx";
import { SectionCard } from "@hotelos/ui/components";
import { formatDate } from "@hotelos/utils";
import { Globe } from "lucide-react";

const STEPS = [
  {
    id: "stay",
    title: "Booking Details",
    subtitle: "Website dates & requests",
  },
  {
    id: "guest",
    title: "Guest Information",
    subtitle: "Website registration data",
  },
  { id: "room", title: "Select Room & Rate", subtitle: "Selected room type" },
  {
    id: "options",
    title: "Additional Options",
    subtitle: "Add-ons & preferences",
  },
  {
    id: "confirm",
    title: "Review & Create",
    subtitle: "Confirm website booking",
  },
];

export default function WebsiteReservationPage() {
  const wizard = useReservationWizard({
    source: "WEBSITE",
    steps: STEPS,
    initialCustomForm: (searchParams) => {
      const base = defaultInitialForm("WEBSITE", {
        guestMode: "new",
        purpose: "Leisure",
      });
      if (searchParams.get("roomTypeCode"))
        base.roomTypeCode = searchParams.get("roomTypeCode");
      if (searchParams.get("ratePlanId"))
        base.ratePlanId = searchParams.get("ratePlanId");
      return base;
    },
  });

  const {
    editId,
    form,
    onFieldChange,
    onRequirementsChange,
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

  const isMultiRoom =
    form.rooms > 1 ||
    (form.roomRequirements && form.roomRequirements.length > 0);

  const media = useMemo(() => {
    const hasReqs = form.roomRequirements?.length > 0;
    const typeSummary = hasReqs
      ? `${form.rooms} Rooms (${form.roomRequirements.map((r) => `${r.rooms}x ${r.roomTypeCode}`).join(", ")})`
      : currentType?.name || form.roomTypeCode || "Not selected";

    return {
      roomTypeName: typeSummary,
      guestsLine: `${form.rooms} Room${form.rooms > 1 ? "s" : ""}, ${form.adults} Adult${form.adults > 1 ? "s" : ""}`,
      datesLine:
        form.checkIn && form.checkOut
          ? `${formatDate(form.checkIn)} → ${formatDate(form.checkOut)} (${nights} night${nights === 1 ? "" : "s"})`
          : "Dates pending",
    };
  }, [
    currentType,
    form.roomTypeCode,
    form.roomRequirements,
    form.rooms,
    form.adults,
    form.checkIn,
    form.checkOut,
    nights,
  ]);

  const summaryPanel = (
    <div className="space-y-4">
      <WebsiteGuestCard guest={form.guest} />
      <BookingSummary
        quote={quote.data}
        quoteLoading={quote.isPending}
        media={media}
        editMode={Boolean(editId)}
        onEdit={() => goToStep(0)}
        onSaveDraft={saveAsDraft}
        onCreate={submitReservation}
        creating={isSubmitting}
        disabled={
          nights < 1 ||
          (!form.roomTypeCode &&
            (!form.roomRequirements || form.roomRequirements.length === 0))
        }
      />
    </div>
  );

  return (
    <ReservationWizardLayout
      title={editId ? "Edit Website Reservation" : "Website Reservation"}
      subtitle="Direct website registration and booking review"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          <Globe className="h-3 w-3" />
          Website (Direct)
        </span>
      }
      banner={<WebsiteRegistrationBanner />}
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
        editId ? "Update Website Reservation" : "Create Website Reservation"
      }
      submitError={submitError}
      summaryPanel={summaryPanel}
    >
      {currentStep === 0 && (
        <StayDetailsSection
          value={form}
          onChange={onFieldChange}
          roomRequirements={form.roomRequirements}
          onRequirementsChange={onRequirementsChange}
          roomTypes={typeItems}
          errors={errors}
          lockedSource="WEBSITE"
          open={true}
        />
      )}

      {currentStep === 1 && (
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

      {currentStep === 2 && (
        <div className="space-y-6">
          {isMultiRoom ? (
            <SectionCard
              number="3"
              title="Room Allocation & Rate Plan"
              subtitle="Configure room type blocks, guest distribution, and select rate plan"
              open={true}
              action={
                <button
                  type="button"
                  onClick={() => {
                    onRequirementsChange([]);
                    onFieldChange("rooms", 1);
                  }}
                  className="text-brand-700 hover:text-brand-900 text-xs font-semibold"
                >
                  Switch to Single Room
                </button>
              }
            >
              <div className="space-y-6">
                <RoomRequirementsMatrix
                  roomRequirements={form.roomRequirements}
                  onChange={onRequirementsChange}
                  roomTypes={typeItems}
                  targetRooms={form.rooms}
                />
                {errors.roomRequirements && (
                  <p className="text-xs font-medium text-rose-500">
                    {errors.roomRequirements}
                  </p>
                )}
                <div className="border-t border-gray-100 pt-4">
                  <RatePlanPicker
                    plans={ratePlanOptions}
                    value={form.ratePlanId}
                    onSelect={(pid) => onFieldChange("ratePlanId", pid)}
                    roomTypeName={
                      currentType?.name || form.roomTypeCode || "Multi-Room"
                    }
                    open={true}
                  />
                </div>
              </div>
            </SectionCard>
          ) : (
            <>
              <RoomTypePicker
                items={typeItems}
                value={form.roomTypeCode}
                onSelect={(code) => {
                  onFieldChange("roomTypeCode", code);
                  onFieldChange("ratePlanId", "");
                  onFieldChange("roomId", "");
                }}
                range={{
                  checkIn: form.checkIn,
                  checkOut: form.checkOut,
                  nights,
                }}
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
            </>
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
            Review Website Booking
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
              {form.roomRequirements?.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-gray-200/60 pt-2 text-xs text-gray-700">
                  {form.roomRequirements.map((r, idx) => (
                    <div key={r.id || idx} className="flex justify-between">
                      <span className="text-brand-900 font-medium">
                        {r.roomTypeCode}
                      </span>
                      <span>{r.rooms} room(s)</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs font-medium text-emerald-700">
                Source: Website (Direct)
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Registered Guest
              </span>
              <p className="mt-1 font-semibold text-gray-900">
                {form.guest.name || "—"}
              </p>
              <p className="text-gray-600">{form.guest.phone || "—"}</p>
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
