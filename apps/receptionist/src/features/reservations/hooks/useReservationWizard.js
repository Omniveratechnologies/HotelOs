import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useRoomTypes } from "../../room-types/hooks/useRoomTypes.js";
import { useRatePlans } from "../../rate-plans/hooks/useRatePlans.js";
import {
  useCreateReservation,
  useUpdateReservation,
  useReservation,
} from "./useReservations.js";
import { useAvailability } from "./useAvailability.js";
import { useAvailableRooms } from "./useAvailableRooms.js";
import { useQuote } from "./useQuote.js";
import { useGuestSearch } from "./useGuestSearch.js";

export function occupancyOf(adults) {
  if (adults <= 1) return "single";
  if (adults === 2) return "double";
  if (adults === 3) return "triple";
  return "quad";
}

export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const n = Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export const DEFAULT_GUEST = {
  name: "",
  phone: "",
  phonePrefix: "+91",
  email: "",
  nationality: "Indian",
  idType: "Aadhaar",
  idNumber: "",
  designation: "",
};

export function defaultInitialForm(source = "DIRECT", extra = {}) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    checkIn: today,
    checkOut: "",
    rooms: 1,
    adults: 1,
    children: 0,
    infants: 0,
    purpose: "",
    source,
    guestType: "individual",
    specialRequests: "",
    roomTypeCode: "",
    ratePlanId: "",
    mealPlan: "",
    rateOverride: "",
    preferSpecificRoom: false,
    roomId: "",
    guestMode: "new",
    guestQuery: "",
    guest: { ...DEFAULT_GUEST },
    addOns: [],
    discount: "",
    status: "CONFIRMED",
    ...extra,
  };
}

/**
 * Common hook powering all HotelOS reservation wizards (New, Phone, Website, Corporate, Group, Repeat).
 * Centralizes form state, dates/nights, live pricing quote, availability lookup, validation, and steps.
 */
export function useReservationWizard({
  source = "DIRECT",
  initialCustomForm = null,
  steps = [],
  validateCustomStep = null,
  buildCustomPayload = null,
} = {}) {
  const { id } = useParams();
  const editId = id || null;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState(() => {
    if (initialCustomForm) {
      return initialCustomForm(searchParams);
    }
    const base = defaultInitialForm(source);
    if (searchParams.get("roomTypeCode")) {
      base.roomTypeCode = searchParams.get("roomTypeCode");
    }
    if (searchParams.get("ratePlanId")) {
      base.ratePlanId = searchParams.get("ratePlanId");
    }
    if (searchParams.get("roomId")) {
      base.roomId = searchParams.get("roomId");
      base.preferSpecificRoom = true;
    }
    return base;
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loaded, setLoaded] = useState(!editId);

  const { roomTypes, isLoading: typesLoading } = useRoomTypes();
  const { ratePlans, isLoading: plansLoading } = useRatePlans();

  const { availability } = useAvailability({
    checkIn: form.checkIn,
    checkOut: form.checkOut,
  });

  const nights = nightsBetween(form.checkIn, form.checkOut);
  const occupancy = occupancyOf(form.adults);

  const { rooms: availableRooms, isLoading: roomsLoading } = useAvailableRooms({
    roomTypeCode: form.roomTypeCode,
    checkIn: form.checkIn,
    checkOut: form.checkOut,
    enabled:
      form.preferSpecificRoom && Boolean(form.roomTypeCode) && nights > 0,
  });

  const quote = useQuote();
  const quoteMutateRef = useRef(quote.mutate);
  useEffect(() => {
    quoteMutateRef.current = quote.mutate;
  }, [quote.mutate]);

  const createReservation = useCreateReservation();
  const updateReservation = useUpdateReservation();
  const existingBooking = useReservation(editId);

  const guestSearch = useGuestSearch(
    form.guestQuery,
    form.guestMode === "existing",
  );

  // Load existing reservation in edit mode
  useEffect(() => {
    if (editId && existingBooking.data && !loaded) {
      const b = existingBooking.data;
      queueMicrotask(() => {
        setForm((prev) => ({
          ...prev,
          checkIn: b.checkIn ? String(b.checkIn).slice(0, 10) : prev.checkIn,
          checkOut: b.checkOut
            ? String(b.checkOut).slice(0, 10)
            : prev.checkOut,
          status: b.status || prev.status,
          rooms: b.rooms || prev.rooms,
          adults: b.adults || prev.adults,
          children: b.children || 0,
          infants: b.infants || 0,
          purpose: b.purpose || prev.purpose,
          source: b.source || source,
          guestType: b.guestType || prev.guestType,
          specialRequests: b.specialRequests || prev.specialRequests,
          roomTypeCode: b.roomTypeCode || b.room?.roomCode || prev.roomTypeCode,
          ratePlanId: b.ratePlan?.id ? String(b.ratePlan.id) : prev.ratePlanId,
          mealPlan: b.mealPlan || prev.mealPlan,
          roomId: b.roomId ? String(b.roomId) : prev.roomId,
          preferSpecificRoom: Boolean(b.roomId),
          guestMode: b.guestId ? "existing" : prev.guestMode,
          guestQuery: b.name || prev.guestQuery,
          guest: {
            ...prev.guest,
            name: b.name || prev.guest.name,
            phone: b.phone || prev.guest.phone,
            email: b.email || prev.guest.email,
            nationality: b.nationality || prev.guest.nationality,
            idType: b.idType || prev.guest.idType,
            idNumber: b.idNumber || prev.guest.idNumber,
          },
          addOns: b.pricing?.addOns || prev.addOns,
          discount: b.pricing?.discount?.value
            ? String(b.pricing.discount.value)
            : prev.discount,
        }));
        setLoaded(true);
      });
    }
  }, [editId, existingBooking.data, loaded, source]);

  // Available room type cards merging availability and rate plan pricing
  const typeItems = useMemo(() => {
    return (roomTypes || [])
      .filter((t) => t.active !== false)
      .map((t) => {
        const avail = (availability || []).find(
          (a) => a.roomTypeCode === t.roomCode,
        );
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

  const ratePlanOptions = useMemo(() => {
    return (ratePlans || [])
      .filter((p) => p.roomCode === form.roomTypeCode)
      .map((p) => ({
        id: String(p.id || p._id),
        name: p.name,
        mealPlan: p.mealPlan,
        rate: p.rate,
      }));
  }, [ratePlans, form.roomTypeCode]);

  // Live debounced server quote
  useEffect(() => {
    if (nights < 1 || !form.roomTypeCode) return;
    const handle = setTimeout(() => {
      quoteMutateRef.current({
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

  // Field mutators
  const onFieldChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((err) => {
        const next = { ...err };
        delete next[field];
        return next;
      });
    }
  };

  const onGuestField = (field, value) => {
    setForm((f) => ({ ...f, guest: { ...f.guest, [field]: value } }));
    const errKey = `guest.${field}`;
    if (errors[errKey]) {
      setErrors((err) => {
        const next = { ...err };
        delete next[errKey];
        return next;
      });
    }
  };

  const onSelectExistingGuest = (g) => {
    setForm((f) => ({
      ...f,
      guestMode: "existing",
      guestQuery: g.name || "",
      guest: {
        name: g.name || "",
        phone: g.phone || "",
        phonePrefix: g.phonePrefix || "+91",
        email: g.email || "",
        nationality: g.nationality || "Indian",
        idType: g.idType || "Aadhaar",
        idNumber: g.idNumber || "",
        designation: g.designation || "",
      },
    }));
    setErrors((err) => {
      const next = { ...err };
      delete next["guest.name"];
      delete next["guest.phone"];
      return next;
    });
  };

  // Step validation
  const validateStep = (stepIdx) => {
    const errs = {};
    const stepDef = steps[stepIdx];
    const stepId = stepDef?.id || stepIdx;

    if (validateCustomStep) {
      const customErrs = validateCustomStep(stepId, form, nights);
      if (customErrs && Object.keys(customErrs).length > 0) {
        return customErrs;
      }
    }

    // Match validation to stepId
    if (stepId === "stay") {
      if (!form.checkIn) errs.checkIn = "Check-in date is required";
      if (!form.checkOut) errs.checkOut = "Check-out date is required";
      if (form.checkIn && form.checkOut && nights < 1) {
        errs.checkOut = "Check-out must be after check-in";
      }
      if (!form.adults || form.adults < 1) {
        errs.adults = "At least 1 adult is required";
      }
      if (!form.rooms || form.rooms < 1) {
        errs.rooms = "At least 1 room is required";
      }
    }

    if (stepId === "room") {
      if (!form.roomTypeCode) {
        errs.roomTypeCode = "Please select a room type";
      }
      if (form.preferSpecificRoom && !form.roomId) {
        errs.roomId = "Please select a specific room number";
      }
    }

    if (stepId === "guest") {
      if (!form.guest?.name?.trim()) {
        errs["guest.name"] = "Guest name is required";
      }
      if (!form.guest?.phone?.trim()) {
        errs["guest.phone"] = "Phone number is required";
      }
    }

    return errs;
  };

  const nextStep = () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return false;
    }
    setErrors({});
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
      return true;
    }
    return true;
  };

  const prevStep = () => {
    setErrors({});
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const goToStep = (target) => {
    if (target < currentStep) {
      setErrors({});
      setCurrentStep(target);
      return;
    }
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setCurrentStep(target);
  };

  // Build standard payload
  const buildPayload = (statusOverride) => {
    let effectiveStatus;
    if (statusOverride === "DRAFT") {
      effectiveStatus = "DRAFT";
    } else if (editId) {
      effectiveStatus =
        form.status || existingBooking.data?.status || "CONFIRMED";
    } else {
      effectiveStatus = statusOverride || "CONFIRMED";
    }

    if (buildCustomPayload) {
      return buildCustomPayload(form, effectiveStatus, quote.data);
    }
    return {
      status: effectiveStatus,
      source: form.source || source,
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
    };
  };

  const saveAsDraft = async () => {
    setSubmitError("");
    const payload = buildPayload("DRAFT");
    try {
      if (editId) {
        await updateReservation.mutateAsync({ id: editId, updates: payload });
      } else {
        await createReservation.mutateAsync(payload);
      }
      navigate("/reservations");
    } catch (err) {
      setSubmitError(err?.message || "Failed to save draft");
    }
  };

  const submitReservation = async () => {
    setSubmitError("");
    // Validate all required steps
    for (let i = 0; i < steps.length - 1; i++) {
      const stepErrs = validateStep(i);
      if (Object.keys(stepErrs).length > 0) {
        setErrors(stepErrs);
        setCurrentStep(i);
        return;
      }
    }

    const payload = buildPayload();
    try {
      let result;
      if (editId) {
        result = await updateReservation.mutateAsync({
          id: editId,
          updates: payload,
        });
      } else {
        result = await createReservation.mutateAsync(payload);
      }
      const newId = result?.id || result?._id || editId;
      navigate(newId ? `/reservations?selected=${newId}` : "/reservations");
    } catch (err) {
      setSubmitError(
        err?.message ||
          (editId
            ? "Failed to update reservation"
            : "Failed to create reservation"),
      );
    }
  };

  const isSubmitting =
    createReservation.isPending || updateReservation.isPending;

  return {
    editId,
    form,
    setForm,
    onFieldChange,
    onGuestField,
    onSelectExistingGuest,
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    goToStep,
    steps,
    errors,
    setErrors,
    submitError,
    setSubmitError,
    nights,
    occupancy,
    typeItems,
    ratePlanOptions,
    typesLoading,
    plansLoading,
    roomsLoading,
    availableRooms,
    quote,
    guestSearch,
    saveAsDraft,
    submitReservation,
    isSubmitting,
    navigate,
  };
}
