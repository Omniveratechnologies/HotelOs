import { useEffect, useMemo, useState } from "react";
import ReservationWizardLayout from "../components/ReservationWizardLayout.jsx";
import {
  useReservationWizard,
  defaultInitialForm,
} from "../hooks/useReservationWizard.js";
import CorporateAccountSection from "../components/CorporateAccountSection.jsx";
import CorporateGuestListTable from "../components/CorporateGuestListTable.jsx";
import CorporateCompanyModal from "../../management/components/CorporateCompanyModal.jsx";
import { StayDetailsSection } from "../sections/StayDetailsSection.jsx";
import { RoomTypePicker } from "../sections/RoomTypePicker.jsx";
import { RatePlanPicker } from "../sections/RatePlanPicker.jsx";
import { RoomSelection } from "../sections/RoomSelection.jsx";
import { BookingSummary } from "../sections/BookingSummary.jsx";
import { RoomRequirementsMatrix } from "../components/RoomRequirementsMatrix.jsx";
import { SectionCard } from "@hotelos/ui/components";
import { getCorporateCompanies } from "@hotelos/api";
import { formatDate } from "@hotelos/utils";
import { Building } from "lucide-react";

const STEPS = [
  {
    id: "corporate",
    title: "Corporate Account",
    subtitle: "Company details & billing",
  },
  { id: "stay", title: "Stay Details", subtitle: "Dates, guests, purpose" },
  { id: "guests", title: "Guest Details", subtitle: "Guest list & IDs" },
  { id: "room", title: "Select Room", subtitle: "Room type & rate" },
  { id: "confirm", title: "Confirm & Create", subtitle: "Review booking" },
];

const EMPTY_COMPANY = {
  name: "",
  code: "",
  contactPerson: "",
  phone: "",
  phonePrefix: "+91",
  email: "",
  billingType: "Corporate Account",
  creditLimit: "",
  address: "",
  gstNumber: "",
  paymentTerms: "30 Days",
  costCenter: "",
  tier: "Standard",
  creditFacility: true,
};

export default function CorporateReservationPage() {
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getCorporateCompanies()
      .then((data) => {
        if (active)
          setCompanies(Array.isArray(data) ? data : data?.companies || []);
      })
      .catch(() => {
        if (active) setCompanies([]);
      })
      .finally(() => {
        if (active) setCompaniesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const wizard = useReservationWizard({
    source: "CORPORATE",
    steps: STEPS,
    initialCustomForm: (searchParams) => {
      const base = defaultInitialForm("CORPORATE", {
        purpose: "Business Meeting",
        discount: "5", // 5% default corporate discount
        corporate: { ...EMPTY_COMPANY },
        guests: [],
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
      if (stepId === "corporate") {
        if (!form.corporate?.name?.trim())
          errs["corporate.name"] = "Company name is required";
        if (!form.corporate?.contactPerson?.trim()) {
          errs["corporate.contactPerson"] = "Contact person is required";
        }
        if (!form.corporate?.phone?.trim()) {
          errs["corporate.phone"] = "Phone is required";
        }
      }
      if (stepId === "guests") {
        if (!form.guests || form.guests.length === 0) {
          errs["guests"] = "At least one guest is required";
        }
      }
      return errs;
    },
    buildCustomPayload: (form, status) => {
      const primaryGuest = form.guests?.[0] || {
        name: form.corporate.contactPerson,
        phone: form.corporate.phone,
        email: form.corporate.email,
      };

      const hasRequirements =
        Array.isArray(form.roomRequirements) &&
        form.roomRequirements.length > 0;
      const primaryRoomTypeCode = hasRequirements
        ? form.roomRequirements[0].roomTypeCode
        : form.roomTypeCode;

      return {
        status,
        source: "CORPORATE",
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        rooms: form.rooms,
        adults: form.adults,
        children: form.children,
        infants: form.infants,
        purpose: form.purpose,
        guestType: form.guestType,
        specialRequests: form.specialRequests,
        roomTypeCode: primaryRoomTypeCode || form.roomTypeCode,
        roomRequirements: hasRequirements ? form.roomRequirements : undefined,
        ratePlanId: form.ratePlanId || undefined,
        mealPlan: form.mealPlan || undefined,
        rateOverride:
          form.rateOverride !== "" ? Number(form.rateOverride) : undefined,
        roomId: form.preferSpecificRoom ? form.roomId || undefined : undefined,
        name: primaryGuest.name.trim(),
        phone: `${primaryGuest.phonePrefix || "+91"}${primaryGuest.phone.trim()}`,
        email: primaryGuest.email?.trim() || undefined,
        idType: primaryGuest.idType || undefined,
        idNumber: primaryGuest.idNumber?.trim() || undefined,
        addOns: form.addOns,
        discount:
          form.discount && Number(form.discount) > 0
            ? { type: "percent", value: Number(form.discount) }
            : undefined,
        corporateAccount: {
          ...form.corporate,
        },
        additionalGuests: form.guests.slice(1),
        guestRoster: (form.guests || []).map((g) => ({
          name: g.name,
          phone: g.phone ? `${g.phonePrefix || "+91"}${g.phone}` : null,
          email: g.email || null,
          designation: g.designation || null,
        })),
      };
    },
  });

  const {
    editId,
    form,
    onFieldChange,
    onRequirementsChange,
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
      guestsLine: `${form.rooms} Room${form.rooms > 1 ? "s" : ""}, ${form.guests.length || form.adults} Guest(s)`,
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
    form.guests.length,
    form.adults,
    form.checkIn,
    form.checkOut,
    nights,
  ]);

  const handleCorporateFieldChange = (field, val) => {
    if (field === "all") {
      onFieldChange("corporate", { ...form.corporate, ...val });
    } else {
      onFieldChange("corporate", { ...form.corporate, [field]: val });
    }
  };

  const handleAddGuest = (guest) => {
    onFieldChange("guests", [...(form.guests || []), guest]);
    if (form.adults < (form.guests || []).length + 1) {
      onFieldChange("adults", (form.guests || []).length + 1);
    }
  };

  const handleRemoveGuest = (idx) => {
    const next = [...(form.guests || [])];
    next.splice(idx, 1);
    onFieldChange("guests", next);
  };

  const summaryPanel = (
    <div className="space-y-4">
      {form.corporate.name && (
        <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-xs">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-bold tracking-wider text-purple-900 uppercase">
              Corporate Account
            </h4>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800">
              {form.corporate.billingType}
            </span>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {form.corporate.name}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Terms: {form.corporate.paymentTerms} | {form.corporate.tier}
          </div>
        </div>
      )}

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
      title={editId ? "Edit Corporate Reservation" : "Corporate Reservation"}
      subtitle="Corporate client booking with contracted rates and company billing"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
          <Building className="h-3 w-3" />
          Corporate Channel
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
        editId ? "Update Corporate Reservation" : "Create Corporate Reservation"
      }
      submitError={submitError}
      summaryPanel={summaryPanel}
    >
      {currentStep === 0 && (
        <CorporateAccountSection
          corporate={form.corporate}
          companies={companies}
          companiesLoading={companiesLoading}
          errors={errors}
          onChange={handleCorporateFieldChange}
          onOpenNewCompanyModal={() => setIsModalOpen(true)}
        />
      )}

      {currentStep === 1 && (
        <StayDetailsSection
          value={form}
          onChange={onFieldChange}
          roomRequirements={form.roomRequirements}
          onRequirementsChange={onRequirementsChange}
          roomTypes={typeItems}
          errors={errors}
          lockedSource="CORPORATE"
          open={true}
        />
      )}

      {currentStep === 2 && (
        <CorporateGuestListTable
          guests={form.guests}
          onAddGuest={handleAddGuest}
          onRemoveGuest={handleRemoveGuest}
        />
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          {isMultiRoom ? (
            <SectionCard
              number="4"
              title="Room Allocation & Contracted Rates"
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

      {currentStep === 4 && (
        <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <h3 className="border-b border-gray-100 pb-3 text-lg font-bold text-gray-900">
            Review Corporate Reservation
          </h3>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4">
              <span className="text-xs font-semibold text-purple-700 uppercase">
                Corporate Account
              </span>
              <p className="mt-1 font-semibold text-purple-950">
                {form.corporate.name}
              </p>
              <p className="mt-1 text-xs text-purple-800">
                Billing: {form.corporate.billingType}
              </p>
              <p className="text-xs text-purple-700">
                Terms: {form.corporate.paymentTerms}
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
                {form.rooms} Room(s), {form.guests.length || form.adults}{" "}
                Guest(s)
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
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Guest Roster
              </span>
              <p className="mt-1 font-semibold text-gray-900">
                {form.guests.length} Travelers
              </p>
              <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
                {form.guests.slice(0, 3).map((g) => (
                  <li key={g.id || g.name}>
                    • {g.name} ({g.designation || "Staff"})
                  </li>
                ))}
                {form.guests.length > 3 && (
                  <li className="text-gray-400">
                    + {form.guests.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <CorporateCompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(created) => {
          setCompanies((prev) => [created, ...prev]);
          handleCorporateFieldChange("all", created);
        }}
      />
    </ReservationWizardLayout>
  );
}
