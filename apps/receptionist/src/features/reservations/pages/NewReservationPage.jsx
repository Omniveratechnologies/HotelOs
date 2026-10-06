import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Header,
  Stepper,
  SectionCard,
  InlineBanner,
  Button,
} from "@hotelos/ui/components";
import { formatDate } from "@hotelos/utils";
import { useRoomTypes } from "../../room-types/hooks/useRoomTypes.js";
import { useRatePlans } from "../../rate-plans/hooks/useRatePlans.js";
import {
  useCreateReservation,
  useUpdateReservation,
  useReservation,
} from "../hooks/useReservations.js";
import { useAvailability } from "../hooks/useAvailability.js";
import { useAvailableRooms } from "../hooks/useAvailableRooms.js";
import { useQuote } from "../hooks/useQuote.js";
import { useGuestSearch } from "../hooks/useGuestSearch.js";
import StayDetailsSection from "../sections/StayDetailsSection.jsx";
import RoomTypePicker from "../sections/RoomTypePicker.jsx";
import RatePlanPicker from "../sections/RatePlanPicker.jsx";
import RoomSelection from "../sections/RoomSelection.jsx";
import GuestSection from "../sections/GuestSection.jsx";
import AdditionalOptionsSection from "../sections/AdditionalOptionsSection.jsx";
import BookingSummary from "../sections/BookingSummary.jsx";

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

// Mirrors the pricing engine's occupancy buckets (adults → occupancy).
function occupancyOf(adults) {
  if (adults <= 1) return "single";
  if (adults === 2) return "double";
  if (adults === 3) return "triple";
  return "quad";
}

const EMPTY_GUEST = {
  name: "",
  phone: "",
  phonePrefix: "+91",
  email: "",
  nationality: "Indian",
  idType: "Aadhaar",
  idNumber: "",
};

function initialForm(searchParams) {
  const source = searchParams.get("source") || "DIRECT";
  return {
    checkIn: new Date().toISOString().slice(0, 10),
    checkOut: "",
    rooms: 1,
    adults: 1,
    children: 0,
    infants: 0,
    purpose: "",
    source,
    guestType: "individual",
    specialRequests: "",
    roomTypeCode: searchParams.get("roomTypeCode") || "",
    ratePlanId: searchParams.get("ratePlanId") || "",
    mealPlan: "",
    rateOverride: "",
    preferSpecificRoom: Boolean(searchParams.get("roomId")),
    roomId: searchParams.get("roomId") || "",
    guestMode: "new",
    guestQuery: "",
    guest: { ...EMPTY_GUEST },
    addOns: [],
    discount: "",
  };
}

function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const n = Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function bookingToForm(booking) {
  return {
    checkIn: booking.checkIn ? String(booking.checkIn).slice(0, 10) : "",
    checkOut: booking.checkOut ? String(booking.checkOut).slice(0, 10) : "",
    rooms: booking.rooms || 1,
    adults: booking.adults || 1,
    children: booking.children || 0,
    infants: booking.infants || 0,
    purpose: booking.purpose || "",
    source: booking.source || "DIRECT",
    guestType: booking.guestType || "individual",
    specialRequests: booking.specialRequests || "",
    roomTypeCode: booking.roomTypeCode || booking.room?.roomCode || "",
    ratePlanId: booking.ratePlan?.id ? String(booking.ratePlan.id) : "",
    mealPlan: booking.mealPlan || "",
    rateOverride: "",
    preferSpecificRoom: Boolean(booking.roomId),
    roomId: booking.roomId ? String(booking.roomId) : "",
    guestMode: booking.guestId ? "existing" : "new",
    guestQuery: booking.name || "",
    guest: {
      name: booking.name || "",
      phone: booking.phone || "",
      phonePrefix: "+91",
      email: booking.email || "",
      nationality: booking.nationality || "Indian",
      idType: booking.idType || "Aadhaar",
      idNumber: booking.idNumber || "",
    },
    addOns: booking.pricing?.addOns || [],
    discount: booking.pricing?.discount?.value
      ? String(booking.pricing.discount.value)
      : "",
  };
}

/**
 * Page-based new-reservation wizard (replaces the old modal flow).
 * Steps: Stay Details → Select Room → Guest Details → Additional Options →
 * Confirm & Create. Right rail: live Booking Summary (server-side quote).
 */
export default function NewReservationPage() {
  const { id } = useParams();
  const editId = id || null;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState(() => initialForm(searchParams));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loaded, setLoaded] = useState(!editId);

  const { roomTypes, isLoading: typesLoading } = useRoomTypes();
  const { ratePlans, isLoading: plansLoading } = useRatePlans();
  const { availability } = useAvailability({
    checkIn: form.checkIn,
    checkOut: form.checkOut,
  });
  const { rooms: availableRooms, isLoading: roomsLoading } = useAvailableRooms({
    roomTypeCode: form.roomTypeCode,
    checkIn: form.checkIn,
    checkOut: form.checkOut,
    enabled:
      form.preferSpecificRoom &&
      Boolean(form.roomTypeCode) &&
      nightsBetween(form.checkIn, form.checkOut) > 0,
  });
  const quote = useQuote();
  const createReservation = useCreateReservation();
  const updateReservation = useUpdateReservation();
  const existingBooking = useReservation(editId);
  const guestSearch = useGuestSearch(
    form.guestQuery,
    form.guestMode === "existing",
  );

  const onChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const onGuestField = (field, value) =>
    setForm((f) => ({ ...f, guest: { ...f.guest, [field]: value } }));

  // Load existing reservation in edit mode
  useEffect(() => {
    if (editId && existingBooking.data && !loaded) {
      setForm(bookingToForm(existingBooking.data));
      setLoaded(true);
    }
  }, [editId, existingBooking.data, loaded]);

  const nights = nightsBetween(form.checkIn, form.checkOut);
  const occupancy = occupancyOf(form.adults);

  // Room type cards: merge availability + resolved nightly price per type
  const typeItems = useMemo(() => {
    return (roomTypes || [])
      .filter((t) => t.active !== false)
      .map((t) => {
        const avail = availability.find((a) => a.roomTypeCode === t.roomCode);
        const plan = (ratePlans || []).find(
          (p) =>
            p.roomCode === t.roomCode &&
            p.occupancy === occupancy &&
            (p.mealPlan || "EP") === "EP",
        );
        return {
          roomTypeCode: t.roomCode,
          name: t.name,
          totalRooms: avail?.totalRooms ?? t.count,
          available: avail?.available,
          occupancyMax: t.maxOccupancy,
          price: plan?.rate ?? null,
        };
      });
  }, [roomTypes, availability, ratePlans, occupancy]);

  const ratePlanOptions = useMemo(
    () =>
      (ratePlans || [])
        .filter((p) => p.roomCode === form.roomTypeCode)
        .map((p) => ({
          id: String(p.id || p._id),
          name: p.name,
          mealPlan: p.mealPlan,
          rate: p.rate,
        })),
    [ratePlans, form.roomTypeCode],
  );

  // Live quote (debounced) — pricing math stays server-side
  useEffect(() => {
    if (nights < 1 || !form.roomTypeCode) return;
    const handle = setTimeout(() => {
      quote.mutate({
        roomTypeCode: form.roomTypeCode,
        roomId: form.preferSpecificRoom ? form.roomId || undefined : undefined,
        ratePlanId: form.ratePlanId || undefined,
        mealPlan: form.mealPlan || undefined,
        rateOverride:
          form.rateOverride !== "" ? Number(form.rateOverride) : undefined,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        rooms: form.rooms,
        adults: form.adults,
        addOns: form.addOns,
        discount:
          form.discount && Number(form.discount) > 0
            ? { type: "percent", value: Number(form.discount) }
            : null,
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- quote.mutate identity is stable
  }, [
    form.checkIn,
    form.checkOut,
    form.rooms,
    form.adults,
    form.roomTypeCode,
    form.ratePlanId,
    form.mealPlan,
    form.rateOverride,
    form.preferSpecificRoom,
    form.roomId,
    form.addOns,
    form.discount,
    nights,
  ]);

  // ---- validation (pure per-step error maps) ----
  const getStepErrors = (index) => {
    const e = {};
    if (index === 0) {
      if (!form.checkIn) e.checkIn = "Check-in date is required";
      if (!form.checkOut) e.checkOut = "Check-out is required";
      else if (nights < 1) e.checkOut = "Check-out must be after check-in";
      if (form.adults < 1) e.adults = "At least 1 adult";
    }
    if (index === 1) {
      if (!form.roomTypeCode) e.roomTypeCode = "Select a room type";
      else if (
        availability.length &&
        (availability.find((a) => a.roomTypeCode === form.roomTypeCode)
          ?.available ?? 0) < form.rooms
      ) {
        e.roomTypeCode = "Not enough rooms available for these dates";
      }
      if (form.preferSpecificRoom && !form.roomId) {
        e.roomId = "Select a room number or switch to auto-assign";
      }
    }
    if (index === 2) {
      if (!form.guest.name.trim()) e.name = "Guest name is required";
      if (!form.guest.phone.trim() && !form.guest.email.trim()) {
        e.phone = "Phone or email is required";
      }
      if (!form.guest.idNumber.trim()) e.idNumber = "ID number is required";
    }
    return e;
  };

  const goTo = (index) => {
    if (index < step) {
      setStep(index);
      return;
    }
    const errs = {};
    for (let i = step; i < index; i++) {
      Object.assign(errs, getStepErrors(i));
    }
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setStep(index);
    }
  };

  const sectionState = (index) => ({
    open: step === index,
    summary: step > index ? summaryOf(index) : undefined,
    onEdit: step > index ? () => setStep(index) : undefined,
  });

  const summaryOf = (index) => {
    if (index === 0) {
      return `${formatDate(form.checkIn)} → ${formatDate(form.checkOut)} · ${nights} night${nights === 1 ? "" : "s"} · ${form.adults + form.children} guest${form.adults + form.children === 1 ? "" : "s"}`;
    }
    if (index === 1) {
      const name =
        typeItems.find((t) => t.roomTypeCode === form.roomTypeCode)?.name ||
        form.roomTypeCode;
      return `${name} · ${form.preferSpecificRoom && form.roomId ? `Room ${availableRooms.find((r) => String(r.id) === String(form.roomId))?.roomNumber || ""}` : "Auto assign"}`;
    }
    if (index === 2) {
      return form.guest.name
        ? `${form.guest.name} · ${form.guest.phone || form.guest.email}`
        : "";
    }
    if (index === 3) {
      return form.addOns.length
        ? `${form.addOns.length} add-on${form.addOns.length === 1 ? "" : "s"}`
        : "None";
    }
    return "";
  };

  // ---- submission ----
  const buildPayload = (status) => ({
    name: form.guest.name.trim(),
    email: form.guest.email.trim(),
    phone: `${form.guest.phonePrefix}${form.guest.phone.trim().replace(/^0+/, "")}`,
    address: "",
    idType: form.guest.idType,
    idNumber: form.guest.idNumber.trim(),
    nationality: form.guest.nationality.trim() || undefined,
    checkIn: form.checkIn,
    checkOut: form.checkOut,
    rooms: form.rooms,
    adults: form.adults,
    children: form.children,
    infants: form.infants,
    purpose: form.purpose,
    specialRequests: form.specialRequests,
    guestType: form.guestType,
    source: form.source,
    roomTypeCode: form.roomTypeCode,
    ratePlanId: form.ratePlanId || undefined,
    mealPlan: form.mealPlan || undefined,
    rateOverride:
      form.rateOverride !== "" ? Number(form.rateOverride) : undefined,
    roomId: form.preferSpecificRoom ? form.roomId || undefined : undefined,
    addOns: form.addOns,
    discount:
      form.discount && Number(form.discount) > 0
        ? { type: "percent", value: Number(form.discount) }
        : null,
    status,
  });

  const handleSubmit = async (status) => {
    setSubmitError("");
    const errs = {};
    let firstInvalid = -1;
    for (let i = 0; i <= 2; i++) {
      const stepErrs = getStepErrors(i);
      if (Object.keys(stepErrs).length && firstInvalid === -1) {
        firstInvalid = i;
      }
      Object.assign(errs, stepErrs);
    }
    setErrors(errs);
    if (firstInvalid !== -1) {
      setStep(firstInvalid);
      return;
    }

    try {
      if (editId) {
        await updateReservation.mutateAsync({
          id: editId,
          updates: buildPayload(status),
        });
        navigate("/reservations", { state: { updated: true } });
        return;
      }
      const result = await createReservation.mutateAsync(buildPayload(status));
      navigate("/reservations", {
        state: {
          created: result?.reservationNo || result?.id,
          note: result?.credentials?.emailSent
            ? "Guest credentials emailed."
            : "Reservation created — guest credentials could not be emailed (no email on file).",
        },
      });
    } catch (err) {
      console.error("Save reservation error:", err);
      setErrors({});
      setSubmitError(err.message || "Failed to save reservation.");
      setStep(4);
    }
  };

  const guestsLine = `${form.adults} Adult${form.adults === 1 ? "" : "s"}${form.children ? `, ${form.children} Child${form.children === 1 ? "" : "ren"}` : ""}`;
  const datesLine =
    form.checkIn && form.checkOut
      ? `${formatDate(form.checkIn)} – ${formatDate(form.checkOut)} (${nights} Night${nights === 1 ? "" : "s"})`
      : "";
  const selectedTypeName =
    typeItems.find((t) => t.roomTypeCode === form.roomTypeCode)?.name || "";

  return (
    <>
      <Header
        pageTitle={editId ? "Edit Reservation" : "New Reservation"}
        pageDescription={
          editId
            ? "Modify the reservation and save changes"
            : "Create a reservation for a guest"
        }
      >
        <Button
          variant="secondary"
          icon={ArrowLeft}
          onClick={() => navigate("/reservations")}
        >
          Back
        </Button>
      </Header>

      <div className="mx-auto max-w-360 space-y-6 p-4 pb-24 sm:p-6 xl:pb-6">
        <nav aria-label="Breadcrumb" className="text-surface-500 text-xs">
          <button
            type="button"
            onClick={() => navigate("/reservations")}
            className="hover:text-brand-700"
          >
            Bookings
          </button>
          <span aria-hidden="true" className="mx-1.5">
            ›
          </span>
          <span className="text-brand-900 font-medium">
            {editId ? "Edit Reservation" : "New Reservation"}
          </span>
        </nav>

        <SectionCard className="px-5 py-4">
          <Stepper steps={STEPS} currentIndex={step} onStepClick={goTo} />
        </SectionCard>

        {/* Website source banner */}
        {form.source === "WEBSITE" && (
          <SectionCard className="border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 shrink-0 text-emerald-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-800">
                  This guest registered and booked through your website.
                </p>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-emerald-700 underline hover:text-emerald-900"
              >
                View Registration Details →
              </button>
            </div>
          </SectionCard>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* LEFT — step content */}
          <div className="col-span-12 space-y-4 xl:col-span-8">
            <StayDetailsSection
              value={form}
              onChange={onChange}
              errors={errors}
              {...sectionState(0)}
              lockedSource={form.source === "WEBSITE" ? "WEBSITE" : undefined}
            />

            <div>
              <RoomTypePicker
                items={typeItems}
                value={form.roomTypeCode}
                onSelect={(code) => {
                  setForm((f) => ({
                    ...f,
                    roomTypeCode: code,
                    ratePlanId: "",
                    roomId: "",
                  }));
                }}
                range={{
                  checkIn: form.checkIn,
                  checkOut: form.checkOut,
                  nights,
                }}
                onModifySearch={() => setStep(0)}
                loading={typesLoading}
                {...sectionState(1)}
              />
              {step === 1 && (
                <div className="mt-4 space-y-4">
                  <RatePlanPicker
                    options={ratePlanOptions}
                    value={form.ratePlanId}
                    onChange={(planId) =>
                      setForm((f) => ({ ...f, ratePlanId: planId }))
                    }
                    loading={plansLoading}
                  />
                  <RoomSelection
                    preferSpecific={form.preferSpecificRoom}
                    onToggle={(v) =>
                      setForm((f) => ({
                        ...f,
                        preferSpecificRoom: v,
                        roomId: "",
                      }))
                    }
                    rooms={availableRooms}
                    value={form.roomId}
                    onChange={(v) => onChange("roomId", v)}
                    roomsLoading={roomsLoading}
                    disabled={!form.roomTypeCode || nights < 1}
                  />
                  {errors.roomTypeCode && (
                    <p className="text-xs font-medium text-rose-500">
                      {errors.roomTypeCode}
                    </p>
                  )}
                  {errors.roomId && (
                    <p className="text-xs font-medium text-rose-500">
                      {errors.roomId}
                    </p>
                  )}
                </div>
              )}
            </div>

            <GuestSection
              mode={form.guestMode}
              onModeChange={(m) => onChange("guestMode", m)}
              form={form.guest}
              onField={onGuestField}
              errors={errors}
              searchQuery={form.guestQuery}
              onSearchChange={(q) => onChange("guestQuery", q)}
              searchResults={guestSearch.results}
              searching={guestSearch.isSearching}
              onSelectGuest={(g) => {
                setForm((f) => ({
                  ...f,
                  guestMode: "new",
                  guestQuery: g.name,
                  guest: {
                    name: g.name || "",
                    phone: (g.phone || "").replace(/^\+\d{1,3}\s?/, ""),
                    phonePrefix:
                      (g.phone || "").match(/^\+\d{1,3}/)?.[0] || "+91",
                    email: g.email || "",
                    nationality: g.nationality || "Indian",
                    idType: g.idType || "Aadhaar",
                    idNumber: g.idNumber || "",
                  },
                }));
              }}
              {...sectionState(2)}
            />

            <AdditionalOptionsSection
              addOns={form.addOns}
              onAddOnsChange={(v) => onChange("addOns", v)}
              specialRequests={form.specialRequests}
              onSpecialRequestsChange={(v) => onChange("specialRequests", v)}
              {...sectionState(3)}
            />

            {step === 4 && (
              <SectionCard number="5" title="Confirm & Create">
                <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                  <ReviewRow
                    label="Stay"
                    value={`${formatDate(form.checkIn)} → ${formatDate(form.checkOut)} · ${nights} night${nights === 1 ? "" : "s"}`}
                    onEdit={() => setStep(0)}
                  />
                  <ReviewRow
                    label="Rooms / Guests"
                    value={`${form.rooms} room${form.rooms === 1 ? "" : "s"} · ${guestsLine}`}
                    onEdit={() => setStep(0)}
                  />
                  <ReviewRow
                    label="Room Type"
                    value={selectedTypeName || "—"}
                    onEdit={() => setStep(1)}
                  />
                  <ReviewRow
                    label="Rate Plan"
                    value={quote.data?.ratePlan?.name || "Standard rate"}
                    onEdit={() => setStep(1)}
                  />
                  <ReviewRow
                    label="Guest"
                    value={`${form.guest.name} · ${form.guest.phonePrefix} ${form.guest.phone}`}
                    onEdit={() => setStep(2)}
                  />
                  <ReviewRow
                    label="ID"
                    value={`${form.guest.idType} · ${form.guest.idNumber || "—"}`}
                    onEdit={() => setStep(2)}
                  />
                  <ReviewRow
                    label="Purpose / Source"
                    value={`${form.purpose || "—"} · ${form.source}`}
                    onEdit={() => setStep(0)}
                  />
                  <ReviewRow
                    label="Add-ons"
                    value={summaryOf(3)}
                    onEdit={() => setStep(3)}
                  />
                  <ReviewRow
                    label="Discount"
                    value={
                      form.discount && Number(form.discount) > 0
                        ? `${form.discount}%`
                        : "None"
                    }
                    onEdit={() => setStep(4)}
                  />
                </dl>

                <div className="mt-4">
                  <label
                    htmlFor="discount"
                    className="text-brand-900 mb-1.5 block text-sm font-semibold"
                  >
                    Discount (% on room charge, before tax)
                  </label>
                  <input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={form.discount}
                    onChange={(e) => onChange("discount", e.target.value)}
                    placeholder="0"
                    className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-40 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2"
                  />
                </div>

                {submitError && (
                  <InlineBanner variant="error" className="mt-4">
                    {submitError}
                  </InlineBanner>
                )}
              </SectionCard>
            )}

            {step < 4 && (
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                >
                  Back
                </Button>
                <Button
                  className="ml-2"
                  icon={ArrowRight}
                  onClick={() => goTo(step + 1)}
                >
                  Continue
                </Button>
              </div>
            )}
          </div>

          {/* RIGHT — sticky live summary */}
          <div className="col-span-12 xl:col-span-4">
            <BookingSummary
              quote={quote.data}
              quoteLoading={quote.isPending}
              media={{
                roomTypeName: selectedTypeName,
                guestsLine,
                datesLine,
              }}
              editMode={Boolean(editId)}
              onEdit={() => setStep(0)}
              onSaveDraft={() => handleSubmit("draft")}
              onCreate={() => handleSubmit("confirmed")}
              creating={
                createReservation.isPending || updateReservation.isPending
              }
              disabled={nights < 1 || !form.roomTypeCode}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function ReviewRow({ label, value, onEdit }) {
  return (
    <div className="border-surface-100 flex items-start justify-between gap-3 border-b py-2 last:border-0">
      <div>
        <dt className="text-surface-500 text-xs">{label}</dt>
        <dd className="text-brand-900 mt-0.5 text-sm font-medium">
          {value || "—"}
        </dd>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-brand-700 hover:text-brand-900 text-xs font-semibold"
        >
          Edit
        </button>
      )}
    </div>
  );
}
