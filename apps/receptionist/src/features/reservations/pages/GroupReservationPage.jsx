import { useState } from "react";
import ReservationWizardLayout from "../components/ReservationWizardLayout.jsx";
import {
  useReservationWizard,
  defaultInitialForm,
} from "../hooks/useReservationWizard.js";
import {
  GroupDetailsSection,
  GroupRequirementsSection,
  GroupGuestListSection,
  GroupAllocationSummary,
} from "../components/GroupComponents.jsx";
import { Users } from "lucide-react";

const STEPS = [
  { id: "group", title: "Group Details", subtitle: "Organizer & event" },
  {
    id: "requirements",
    title: "Room Requirements",
    subtitle: "Room types & dates",
  },
  { id: "roster", title: "Guest List", subtitle: "Participants & roster" },
  {
    id: "confirm",
    title: "Confirm & Create",
    subtitle: "Review group booking",
  },
];

export default function GroupReservationPage() {
  const [roomRequirements, setRoomRequirements] = useState([]);
  const [guests, setGuests] = useState([]);

  const wizard = useReservationWizard({
    source: "GROUP",
    steps: STEPS,
    initialCustomForm: () => {
      const today = new Date().toISOString().slice(0, 10);
      const checkoutDate = new Date(Date.now() + 2 * 86400000)
        .toISOString()
        .slice(0, 10);
      return defaultInitialForm("GROUP", {
        groupName: "",
        groupType: "Corporate",
        organizerName: "",
        organizerPhone: "",
        organizerEmail: "",
        companyName: "",
        eventPurpose: "",
        checkIn: today,
        checkOut: checkoutDate,
        rooms: 1,
        adults: 2,
        discount: "0",
        roomTypeCode: "",
      });
    },
    validateCustomStep: (stepId, form) => {
      const errs = {};
      if (stepId === "group") {
        if (!form.groupName?.trim()) errs.groupName = "Group name is required";
        if (!form.organizerName?.trim())
          errs.organizerName = "Organizer name is required";
        if (!form.organizerPhone?.trim())
          errs.organizerPhone = "Organizer phone is required";
      }
      return errs;
    },
    buildCustomPayload: (form, status) => ({
      status,
      source: "GROUP",
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      rooms: roomRequirements.reduce((acc, r) => acc + Number(r.rooms || 0), 0),
      adults: roomRequirements.reduce(
        (acc, r) => acc + Number(r.rooms || 0) * Number(r.adultsPerRoom || 1),
        0,
      ),
      children: 0,
      infants: 0,
      purpose: form.eventPurpose || "Group Event",
      guestType: "group",
      specialRequests: form.specialRequests,
      roomTypeCode: form.roomTypeCode || "EXEC",
      name: form.organizerName.trim(),
      phone: `+91${form.organizerPhone.trim()}`,
      email: form.organizerEmail?.trim() || undefined,
      discount: { type: "percent", value: Number(form.discount || 5) },
      metadata: {
        groupName: form.groupName,
        groupType: form.groupType,
        companyName: form.companyName,
        roomRequirements,
        guests,
        billingMode: "Master Folio",
      },
    }),
  });

  const {
    editId,
    form,
    onFieldChange,
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    errors,
    submitError,
    nights,
    typeItems,
    quote,
    saveAsDraft,
    submitReservation,
    isSubmitting,
    navigate,
  } = wizard;

  const handleAutoAssign = () => {
    let nextRoomNum = 101;
    setGuests((prev) =>
      prev.map((g) => ({
        ...g,
        assignedRoom: String(nextRoomNum++),
      })),
    );
  };

  const summaryPanel = (
    <GroupAllocationSummary
      form={form}
      roomRequirements={roomRequirements}
      quote={quote.data}
      nights={nights}
    />
  );

  return (
    <ReservationWizardLayout
      title={editId ? "Edit Group Reservation" : "Group Reservation"}
      subtitle="Large block group reservations with multi-room matrix and Master Folio billing"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
          <Users className="h-3 w-3" />
          Group Booking
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
        editId ? "Update Group Reservation" : "Create Group Reservation"
      }
      submitError={submitError}
      summaryPanel={summaryPanel}
    >
      {currentStep === 0 && (
        <GroupDetailsSection
          form={form}
          onChange={onFieldChange}
          errors={errors}
        />
      )}

      {currentStep === 1 && (
        <GroupRequirementsSection
          form={form}
          onChange={onFieldChange}
          roomRequirements={roomRequirements}
          onRequirementsChange={setRoomRequirements}
          roomTypes={
            typeItems.length
              ? typeItems
              : [
                  { roomCode: "EXEC", name: "Executive Room" },
                  { roomCode: "DLX", name: "Deluxe Room" },
                  { roomCode: "STE", name: "Suite Room" },
                ]
          }
        />
      )}

      {currentStep === 2 && (
        <GroupGuestListSection
          guests={guests}
          onAddGuest={(g) => setGuests((prev) => [...prev, g])}
          onRemoveGuest={(idx) => {
            const next = [...guests];
            next.splice(idx, 1);
            setGuests(next);
          }}
          onAutoAssign={handleAutoAssign}
        />
      )}

      {currentStep === 3 && (
        <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <h3 className="border-b border-gray-100 pb-3 text-lg font-bold text-gray-900">
            Review Group Reservation & Billing
          </h3>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <span className="text-xs font-semibold text-blue-700 uppercase">
                Group & Event
              </span>
              <p className="mt-1 font-semibold text-blue-950">
                {form.groupName}
              </p>
              <p className="mt-1 text-xs text-blue-800">
                Organizer: {form.organizerName}
              </p>
              <p className="text-xs text-blue-700">{form.companyName}</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Room Blocks
              </span>
              <p className="mt-1 font-semibold text-gray-900">
                {roomRequirements.reduce(
                  (acc, r) => acc + Number(r.rooms || 0),
                  0,
                )}{" "}
                Total Rooms
              </p>
              <p className="text-gray-600">
                {form.checkIn} → {form.checkOut} ({nights} nights)
              </p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
              <span className="text-xs font-semibold text-amber-800 uppercase">
                Master Folio
              </span>
              <p className="mt-1 font-semibold text-amber-950">
                Invoiced to Organization
              </p>
              <p className="mt-1 text-xs text-amber-800">
                Advance Deposit: ₹20,000
              </p>
              <p className="text-xs text-amber-700">Payment: 30 Days</p>
            </div>
          </div>
        </div>
      )}
    </ReservationWizardLayout>
  );
}
