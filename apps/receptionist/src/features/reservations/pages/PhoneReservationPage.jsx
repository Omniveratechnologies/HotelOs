import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, Phone } from "lucide-react";
import {
  Header,
  Stepper,
  SectionCard,
  InlineBanner,
  Button,
  Input,
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
  return {
    checkIn: new Date().toISOString().slice(0, 10),
    checkOut: "",
    rooms: 1,
    adults: 1,
    children: 0,
    infants: 0,
    purpose: "",
    source: "PHONE",
    guestType: "individual",
    specialRequests: "",
    roomTypeCode: searchParams.get("roomTypeCode") || "",
    ratePlanId: searchParams.get("ratePlanId") || "",
    mealPlan: "",
    rateOverride: "",
    preferSpecificRoom: Boolean(searchParams.get("roomId")),
    roomId: searchParams.get("roomId") || "",
    guestMode: "existing", // Phone defaults to existing guest search
    guestQuery: "",
    guest: { ...EMPTY_GUEST },
    addOns: [],
    discount: "",
    // Call Information fields
    callerName: "",
    callerPhone: "",
    callerPhonePrefix: "+91",
    callTime: new Date().toISOString().slice(0, 16), // datetime-local format
    callNotes: "",
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
    source: booking.source || "PHONE",
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
    callerName: booking.callerName || "",
    callerPhone: booking.callerPhone || "",
    callerPhonePrefix: "+91",
    callTime: booking.callTime
      ? String(booking.callTime).slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    callNotes: booking.callNotes || "",
  };
}

/**
 * Phone Reservation page — booking taken over a phone call.
 * Adds a Call Information block so the hotel keeps a record of who called,
 * when, and what was discussed.
 */
export default function PhoneReservationPage() {
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
      if (existingBooking.data.guestId) {
        // If editing and there's a guest, pre-select them
        setSelectedGuest({
          id: existingBooking.data.guestId,
          name: existingBooking.data.name,
          phone: existingBooking.data.phone,
          email: existingBooking.data.email,
          nationality: existingBooking.data.nationality,
          idType: existingBooking.data.idType,
          idNumber: existingBooking.data.idNumber,
        });
      }
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
      // Call Information
      if (!form.callerName.trim()) e.callerName = "Caller name is required";
      if (!form.callerPhone.trim()) e.callerPhone = "Caller phone is required";
    }
    if (index === 1) {
      // Stay Details
      if (!form.checkIn) e.checkIn = "Check-in date is required";
      if (!form.checkOut) e.checkOut = "Check-out is required";
      else if (nights < 1) e.checkOut = "Check-out must be after check-in";
      if (form.adults < 1) e.adults = "At least 1 adult";
    }
    if (index === 2) {
      // Room Type
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
    if (index === 3) {
      // Guest Details
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
      const callInfo = `${form.callerName} · ${form.callerPhonePrefix} ${form.callerPhone}`;
      return `${callInfo} · ${formatDate(form.checkIn)} → ${formatDate(form.checkOut)} · ${nights} night${nights === 1 ? "" : "s"} · ${form.adults + form.children} guest${form.adults + form.children === 1 ? "" : "s"}`;
    }
    if (index === 1) {
      return `${formatDate(form.checkIn)} → ${formatDate(form.checkOut)} · ${nights} night${nights === 1 ? "" : "s"} · ${form.adults + form.children} guest${form.adults + form.children === 1 ? "" : "s"}`;
    }
    if (index === 2) {
      const name =
        typeItems.find((t) => t.roomTypeCode === form.roomTypeCode)?.name ||
        form.roomTypeCode;
      return `${name} · ${form.preferSpecificRoom && form.roomId ? `Room ${availableRooms.find((r) => String(r.id) === String(form.roomId))?.roomNumber || ""}` : "Auto assign"}`;
    }
    if (index === 3) {
      return form.guest.name
        ? `${form.guest.name} · ${form.guest.phone || form.guest.email}`
        : "";
    }
    if (index === 4) {
      return form.addOns.length
        ? `${form.addOns.length} add-on${form.addOns.length === 1 ? "" : "s"}`
        : "None";
    }
    if (index === 5) {
      return "Review and confirm booking";
    }
    return "";
  };

  const handleGuestSelect = (g) => {
    setForm((f) => ({
      ...f,
      guestMode: "new",
      guestQuery: g.name,
      guest: {
        name: g.name || "",
        phone: (g.phone || "").replace(/^\+\d{1,3}\s?/, ""),
        phonePrefix: (g.phone || "").match(/^\+\d{1,3}/)?.[0] || "+91",
        email: g.email || "",
        nationality: g.nationality || "Indian",
        idType: g.idType || "Aadhaar",
        idNumber: g.idNumber || "",
      },
    }));
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
    source: "PHONE",
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
    // Call Information fields
    callerName: form.callerName.trim(),
    callerPhone: `${form.callerPhonePrefix}${form.callerPhone.trim().replace(/^0+/, "")}`,
    callTime: form.callTime,
    callNotes: form.callNotes.trim(),
  });

  const handleSubmit = async (status) => {
    setSubmitError("");
    const errs = {};
    let firstInvalid = -1;
    for (let i = 0; i <= 3; i++) {
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

  const selectedTypeName =
    typeItems.find((t) => t.roomTypeCode === form.roomTypeCode)?.name || "";

  return (
    <>
      <Header
        pageTitle={editId ? "Edit Phone Reservation" : "Phone Reservation"}
        pageDescription={
          editId
            ? "Modify the phone reservation and save changes"
            : "Create a reservation taken over a phone call"
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
            {editId ? "Edit Phone Reservation" : "Phone Reservation"}
          </span>
        </nav>

        {/* Call Info badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          <Phone size={14} />
          Phone Reservation
        </div>

        <SectionCard className="px-5 py-4">
          <Stepper steps={STEPS} currentIndex={step} onStepClick={goTo} />
        </SectionCard>

        <div className="grid grid-cols-12 gap-6">
          {/* LEFT — step content */}
          <div className="col-span-12 space-y-4 xl:col-span-8">
            {/* Step 0: Call Information */}
            {step === 0 && (
              <SectionCard number="1" title="Call Information">
                <div className="grid grid-cols-12 gap-4">
                  <Input
                    label="Caller Name"
                    name="caller-name"
                    required
                    placeholder="e.g. Rohit Sharma"
                    value={form.callerName}
                    onChange={(e) => onChange("callerName", e.target.value)}
                    error={errors.callerName}
                    className="col-span-12 sm:col-span-6"
                  />
                  <div className="col-span-12 sm:col-span-6">
                    <label
                      htmlFor="caller-phone"
                      className="text-brand-900 mb-1.5 block text-sm font-semibold"
                    >
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="flex">
                        <select
                          aria-label="Country code"
                          value={form.callerPhonePrefix}
                          onChange={(e) =>
                            onChange("callerPhonePrefix", e.target.value)
                          }
                          className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-20 rounded-lg rounded-r-none border border-r-0 border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
                        >
                          <option value="+91">+91</option>
                          <option value="+1">+1</option>
                          <option value="+44">+44</option>
                          <option value="+61">+61</option>
                          <option value="+971">+971</option>
                        </select>
                        <input
                          id="caller-phone"
                          type="tel"
                          value={form.callerPhone}
                          onChange={(e) =>
                            onChange("callerPhone", e.target.value)
                          }
                          placeholder="98765 43210"
                          className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 flex-1 rounded-lg rounded-l-none border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 px-3"
                        aria-label="Call"
                      >
                        <Phone size={16} />
                      </Button>
                    </div>
                    {errors.callerPhone && (
                      <p className="mt-1.5 text-xs font-medium text-rose-500">
                        {errors.callerPhone}
                      </p>
                    )}
                  </div>
                  <Input
                    type="datetime-local"
                    label="Call Time"
                    name="call-time"
                    value={form.callTime}
                    onChange={(e) => onChange("callTime", e.target.value)}
                    className="col-span-12 sm:col-span-6"
                  />
                  <div className="col-span-12">
                    <label
                      htmlFor="call-notes"
                      className="text-brand-900 mb-1.5 block text-sm font-semibold"
                    >
                      Call Notes{" "}
                      <span className="text-surface-500">(Optional)</span>
                    </label>
                    <textarea
                      id="call-notes"
                      value={form.callNotes}
                      onChange={(e) => onChange("callNotes", e.target.value)}
                      placeholder="e.g. 2 rooms for family. Prefer high floor."
                      rows={3}
                      className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-24 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none placeholder:text-gray-400 focus:ring-2"
                    />
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Step 1: Stay Details (Source locked to Phone) */}
            {step === 1 && (
              <StayDetailsSection
                value={form}
                onChange={onChange}
                errors={errors}
                {...sectionState(1)}
              />
            )}

            {/* Step 2: Select Room */}
            {step === 2 && (
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
                    nights: nightsBetween(form.checkIn, form.checkOut),
                  }}
                  onModifySearch={() => setStep(1)}
                  loading={typesLoading}
                  {...sectionState(2)}
                />
                {form.roomTypeCode && (
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
                      disabled={
                        !form.roomTypeCode ||
                        nightsBetween(form.checkIn, form.checkOut) < 1
                      }
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
            )}

            {/* Step 3: Guest Details — GuestSection handles Existing/New Guest search internally */}
            {step === 3 && (
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
                onSelectGuest={handleGuestSelect}
                {...sectionState(3)}
              />
            )}

            {/* Step 4: Additional Options */}
            {step === 4 && (
              <AdditionalOptionsSection
                addOns={form.addOns}
                onAddOnsChange={(v) => onChange("addOns", v)}
                specialRequests={form.specialRequests}
                onSpecialRequestsChange={(v) => onChange("specialRequests", v)}
                {...sectionState(4)}
              />
            )}

            {/* Step 5: Confirm & Create */}
            {step === 5 && (
              <SectionCard number="5" title="Confirm & Create">
                <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                  <ReviewRow
                    label="Stay"
                    value={`${formatDate(form.checkIn)} → ${formatDate(form.checkOut)} · ${nightsBetween(form.checkIn, form.checkOut)} night${nightsBetween(form.checkIn, form.checkOut) === 1 ? "" : "s"} · ${form.adults + form.children} guest${form.adults + form.children === 1 ? "" : "s"}`}
                    onEdit={() => setStep(1)}
                  />
                  <ReviewRow
                    label="Room Type"
                    value={
                      typeItems.find(
                        (t) => t.roomTypeCode === form.roomTypeCode,
                      )?.name || "—"
                    }
                    onEdit={() => setStep(2)}
                  />
                  <ReviewRow
                    label="Rate Plan"
                    value={quote.data?.ratePlan?.name || "Standard rate"}
                    onEdit={() => setStep(2)}
                  />
                  <ReviewRow
                    label="Guest"
                    value={`${form.guest.name} · ${form.guest.phonePrefix} ${form.guest.phone}`}
                    onEdit={() => setStep(3)}
                  />
                  <ReviewRow
                    label="ID"
                    value={`${form.guest.idType} · ${form.guest.idNumber || "—"}`}
                    onEdit={() => setStep(3)}
                  />
                  <ReviewRow
                    label="Purpose / Source"
                    value={`${form.purpose || "—"} · Phone`}
                    onEdit={() => setStep(1)}
                  />
                  <ReviewRow
                    label="Add-ons"
                    value={
                      form.addOns.length
                        ? `${form.addOns.length} add-on${form.addOns.length === 1 ? "" : "s"}`
                        : "None"
                    }
                    onEdit={() => setStep(4)}
                  />
                  <ReviewRow
                    label="Discount"
                    value={
                      form.discount && Number(form.discount) > 0
                        ? `${form.discount}%`
                        : "None"
                    }
                    onEdit={() => setStep(5)}
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

            {/* Navigation */}
            {step < 6 && (
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
                guestsLine: `${form.adults} Adult${form.adults === 1 ? "" : "s"}${form.children ? `, ${form.children} Child${form.children === 1 ? "" : "ren"}` : ""}`,
                datesLine:
                  form.checkIn && form.checkOut
                    ? `${formatDate(form.checkIn)} – ${formatDate(form.checkOut)} (${nightsBetween(form.checkIn, form.checkOut)} Night${nightsBetween(form.checkIn, form.checkOut) === 1 ? "" : "s"})`
                    : "",
              }}
              editMode={Boolean(editId)}
              onEdit={() => setStep(0)}
              onSaveDraft={() => handleSubmit("draft")}
              onCreate={() => handleSubmit("confirmed")}
              creating={
                createReservation.isPending || updateReservation.isPending
              }
              disabled={
                nightsBetween(form.checkIn, form.checkOut) < 1 ||
                !form.roomTypeCode
              }
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
