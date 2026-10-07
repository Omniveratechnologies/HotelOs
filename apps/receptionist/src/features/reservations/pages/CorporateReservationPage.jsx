import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Building,
  FileText,
  Plus,
  Download,
} from "lucide-react";
import {
  Header,
  Stepper,
  SectionCard,
  InlineBanner,
  Button,
  Input,
} from "@hotelos/ui/components";
import { formatDate, formatCurrency } from "@hotelos/utils";
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
import StayDetailsSection from "../sections/StayDetailsSection.jsx";
import RoomTypePicker from "../sections/RoomTypePicker.jsx";
import RatePlanPicker from "../sections/RatePlanPicker.jsx";
import RoomSelection from "../sections/RoomSelection.jsx";
import BookingSummary from "../sections/BookingSummary.jsx";

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

function occupancyOf(adults) {
  if (adults <= 1) return "single";
  if (adults === 2) return "double";
  if (adults === 3) return "triple";
  return "quad";
}

const EMPTY_GUEST = {
  name: "",
  email: "",
  phone: "",
  designation: "",
  idType: "Aadhaar",
  idNumber: "",
};

const EMPTY_COMPANY = {
  name: "",
  code: "",
  contactPerson: "",
  phone: "",
  email: "",
  billingType: "Corporate Account",
  creditLimit: "",
  address: "",
  gstNumber: "",
  paymentTerms: "30 Days",
  costCenter: "",
};

function initialForm() {
  return {
    checkIn: new Date().toISOString().slice(0, 10),
    checkOut: "",
    rooms: 1,
    adults: 1,
    children: 0,
    infants: 0,
    purpose: "Business Meeting",
    source: "CORPORATE",
    guestType: "individual",
    specialRequests: "",
    roomTypeCode: "",
    ratePlanId: "",
    mealPlan: "",
    rateOverride: "",
    preferSpecificRoom: false,
    roomId: "",
    addOns: [],
    discount: "",
    corporate: { ...EMPTY_COMPANY },
    guests: [],
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
    purpose: booking.purpose || "Business Meeting",
    source: booking.source || "CORPORATE",
    guestType: booking.guestType || "individual",
    specialRequests: booking.specialRequests || "",
    roomTypeCode: booking.roomTypeCode || booking.room?.roomCode || "",
    ratePlanId: booking.ratePlan?.id ? String(booking.ratePlan.id) : "",
    mealPlan: booking.mealPlan || "",
    rateOverride: "",
    preferSpecificRoom: Boolean(booking.roomId),
    roomId: booking.roomId ? String(booking.roomId) : "",
    addOns: booking.pricing?.addOns || [],
    discount: booking.pricing?.discount?.value
      ? String(booking.pricing.discount.value)
      : "",
    corporate: booking.corporate || { ...EMPTY_COMPANY },
    guests: booking.guests || [],
  };
}

export default function CorporateReservationPage() {
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

  const onChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const onCorporateChange = (field, value) =>
    setForm((f) => ({ ...f, corporate: { ...f.corporate, [field]: value } }));
  const onGuestChange = (index, field, value) =>
    setForm((f) => {
      const guests = [...f.guests];
      guests[index] = { ...guests[index], [field]: value };
      return { ...f, guests };
    });
  const addGuest = () =>
    setForm((f) => ({ ...f, guests: [...f.guests, { ...EMPTY_GUEST }] }));
  const removeGuest = (index) =>
    setForm((f) => ({ ...f, guests: f.guests.filter((_, i) => i !== index) }));

  // Load existing reservation in edit mode
  useEffect(() => {
    if (editId && existingBooking.data && !loaded) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => {
        if (!loaded) {
          setForm(bookingToForm(existingBooking.data));
          setLoaded(true);
        }
      });
    }
  }, [editId, existingBooking.data, loaded]);

  const nights = nightsBetween(form.checkIn, form.checkOut);
  const occupancy = occupancyOf(form.adults);

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

  // Live quote
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

  const getStepErrors = (index) => {
    const e = {};
    if (index === 0) {
      if (!form.corporate.name.trim())
        e["corporate.name"] = "Company name is required";
      if (!form.corporate.contactPerson.trim())
        e["corporate.contactPerson"] = "Contact person is required";
      if (!form.corporate.phone.trim())
        e["corporate.phone"] = "Contact phone is required";
    }
    if (index === 1) {
      if (!form.checkIn) e.checkIn = "Check-in date is required";
      if (!form.checkOut) e.checkOut = "Check-out is required";
      else if (nights < 1) e.checkOut = "Check-out must be after check-in";
      if (form.adults < 1) e.adults = "At least 1 adult";
    }
    if (index === 2) {
      if (form.guests.length === 0) e.guests = "At least one guest is required";
      form.guests.forEach((g, i) => {
        if (!g.name.trim()) e[`guests.${i}.name`] = "Guest name is required";
        if (!g.idNumber.trim())
          e[`guests.${i}.idNumber`] = "ID number is required";
      });
    }
    if (index === 3) {
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
      return `${form.corporate.name || "—"} · ${form.corporate.contactPerson || "—"}`;
    }
    if (index === 1) {
      return `${formatDate(form.checkIn)} → ${formatDate(form.checkOut)} · ${nights} night${nights === 1 ? "" : "s"} · ${form.guests.length} guest${form.guests.length === 1 ? "" : "s"}`;
    }
    if (index === 2) {
      return `${form.guests.length} guest${form.guests.length === 1 ? "" : "s"}`;
    }
    if (index === 3) {
      const name =
        typeItems.find((t) => t.roomTypeCode === form.roomTypeCode)?.name ||
        form.roomTypeCode;
      return `${name} · ${form.preferSpecificRoom && form.roomId ? `Room ${availableRooms.find((r) => String(r.id) === String(form.roomId))?.roomNumber || ""}` : "Auto assign"}`;
    }
    return "";
  };

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
      const payload = {
        name: form.corporate.name.trim(),
        email: form.corporate.email.trim(),
        phone: form.corporate.phone.trim(),
        address: form.corporate.address.trim(),
        idType: "Corporate",
        idNumber: form.corporate.gstNumber.trim() || "N/A",
        nationality: "Indian",
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        rooms: form.rooms,
        adults: form.guests.length,
        children: 0,
        infants: 0,
        purpose: form.purpose,
        specialRequests: form.specialRequests,
        guestType: "corporate",
        source: "CORPORATE",
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
        corporate: form.corporate,
        guests: form.guests,
      };

      if (editId) {
        await updateReservation.mutateAsync({ id: editId, updates: payload });
        navigate("/reservations", { state: { updated: true } });
        return;
      }
      const result = await createReservation.mutateAsync(payload);
      navigate("/reservations", {
        state: {
          created: result?.reservationNo || result?.id,
          note: "Corporate reservation created",
        },
      });
    } catch (err) {
      console.error("Save reservation error:", err);
      setErrors({});
      setSubmitError(err.message || "Failed to save reservation.");
      setStep(4);
    }
  };

  const guestsLine = `${form.guests.length} guest${form.guests.length === 1 ? "" : "s"}`;
  const datesLine =
    form.checkIn && form.checkOut
      ? `${formatDate(form.checkIn)} – ${formatDate(form.checkOut)} (${nights} Night${nights === 1 ? "" : "s"})`
      : "";
  const selectedTypeName =
    typeItems.find((t) => t.roomTypeCode === form.roomTypeCode)?.name || "";

  return (
    <>
      <Header
        pageTitle={
          editId ? "Edit Corporate Reservation" : "Corporate Reservation"
        }
        pageDescription={
          editId
            ? "Modify the corporate reservation and save changes"
            : "Book rooms for a company under a corporate account"
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
            {editId ? "Edit Corporate Reservation" : "Corporate Reservation"}
          </span>
        </nav>

        <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700">
          <Building size={14} />
          Corporate Account
        </div>

        <SectionCard className="px-5 py-4">
          <Stepper steps={STEPS} currentIndex={step} onStepClick={goTo} />
        </SectionCard>

        {/* Corporate banner */}
        <SectionCard className="border-purple-200 bg-purple-50">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 shrink-0 text-purple-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-800">
                Corporate booking — charges will be invoiced to the company.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="px-5 py-4">
          <Stepper steps={STEPS} currentIndex={step} onStepClick={goTo} />
        </SectionCard>

        <div className="grid grid-cols-12 gap-6">
          {/* LEFT — step content */}
          <div className="col-span-12 space-y-4 xl:col-span-8">
            {/* Step 0: Corporate Account */}
            {step === 0 && (
              <SectionCard number="1" title="Corporate Account">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 sm:col-span-6">
                    <label
                      htmlFor="corp-name"
                      className="text-brand-900 mb-1.5 block text-sm font-semibold"
                    >
                      Company Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={form.corporate.name}
                        onChange={(e) =>
                          onCorporateChange("name", e.target.value)
                        }
                        className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
                      >
                        <option value="">Select company…</option>
                        <option value="Tata Consultancy Services (TCS)">
                          Tata Consultancy Services (TCS)
                        </option>
                        <option value="Infosys Limited">Infosys Limited</option>
                        <option value="Wipro Limited">Wipro Limited</option>
                        <option value="HCL Technologies">
                          HCL Technologies
                        </option>
                        <option value="Tech Mahindra">Tech Mahindra</option>
                        <option value="Other">Other (enter manually)</option>
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={Plus}
                        className="h-10"
                      >
                        Add New
                      </Button>
                    </div>
                    {errors["corporate.name"] && (
                      <p className="mt-1.5 text-xs font-medium text-rose-500">
                        {errors["corporate.name"]}
                      </p>
                    )}
                  </div>

                  <div className="col-span-12">
                    <div className="rounded-lg bg-purple-50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="font-semibold text-purple-800">
                          Company Profile
                        </p>
                        <button
                          type="button"
                          variant="text"
                          size="xs"
                          className="text-purple-700 hover:text-purple-900"
                        >
                          View Details
                        </button>
                      </div>
                      <div className="grid grid-cols-12 gap-3 text-sm">
                        <div className="col-span-12 sm:col-span-4">
                          <p className="text-purple-600">Code</p>
                          <p className="font-medium text-purple-900">
                            {form.corporate.code || "TCS001"}
                          </p>
                        </div>
                        <div className="col-span-12 sm:col-span-4">
                          <p className="text-purple-600">Tier</p>
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800">
                            Preferred Partner
                          </span>
                        </div>
                        <div className="col-span-12 sm:col-span-4">
                          <p className="text-purple-600">Facility</p>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                            Credit Facility
                          </span>
                        </div>
                        <div className="col-span-12 sm:col-span-6">
                          <p className="text-purple-600">Contact Person</p>
                          <p className="font-medium text-purple-900">
                            {form.corporate.contactPerson || "—"}
                          </p>
                        </div>
                        <div className="col-span-12 sm:col-span-6">
                          <p className="text-purple-600">Phone</p>
                          <p className="font-medium text-purple-900">
                            {form.corporate.phone || "—"}
                          </p>
                        </div>
                        <div className="col-span-12 sm:col-span-6">
                          <p className="text-purple-600">Email</p>
                          <p className="font-medium text-purple-900">
                            {form.corporate.email || "—"}
                          </p>
                        </div>
                        <div className="col-span-12 sm:col-span-6">
                          <p className="text-purple-600">Credit Limit</p>
                          <p className="font-medium text-purple-900">
                            {form.corporate.creditLimit
                              ? formatCurrency(form.corporate.creditLimit)
                              : "₹5,00,000"}
                          </p>
                        </div>
                        <div className="col-span-12 sm:col-span-6">
                          <p className="text-purple-600">GST Number</p>
                          <p className="font-medium text-purple-900">
                            {form.corporate.gstNumber || "22ABCDE1234F1Z5"}
                          </p>
                        </div>
                        <div className="col-span-12 sm:col-span-6">
                          <p className="text-purple-600">Payment Terms</p>
                          <p className="font-medium text-purple-900">
                            {form.corporate.paymentTerms || "30 Days"}
                          </p>
                        </div>
                        <div className="col-span-12 sm:col-span-6">
                          <p className="text-purple-600">Cost Center</p>
                          <p className="font-medium text-purple-900">
                            {form.corporate.costCenter || "IT Department"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-12 sm:col-span-6">
                    <Input
                      label="Contact Person"
                      name="corp-contact"
                      required
                      placeholder="e.g. Amit Sharma"
                      value={form.corporate.contactPerson}
                      onChange={(e) =>
                        onCorporateChange("contactPerson", e.target.value)
                      }
                      error={errors["corporate.contactPerson"]}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="corp-phone"
                      className="text-brand-900 mb-1.5 block text-sm font-semibold"
                    >
                      Phone <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="flex">
                        <select
                          aria-label="Country code"
                          value={form.corporate.phonePrefix || "+91"}
                          onChange={(e) =>
                            onCorporateChange("phonePrefix", e.target.value)
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
                          id="corp-phone"
                          type="tel"
                          value={form.corporate.phone}
                          onChange={(e) =>
                            onCorporateChange("phone", e.target.value)
                          }
                          placeholder="98765 43210"
                          className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 flex-1 rounded-lg rounded-l-none border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
                        />
                      </div>
                    </div>
                    {errors["corporate.phone"] && (
                      <p className="col-span-6 mt-1.5 text-xs font-medium text-rose-500 sm:col-span-3">
                        {errors["corporate.phone"]}
                      </p>
                    )}
                  </div>
                  <Input
                    label="Email"
                    name="corp-email"
                    type="email"
                    placeholder="billing@company.com"
                    value={form.corporate.email}
                    onChange={(e) => onCorporateChange("email", e.target.value)}
                    className="col-span-12 sm:col-span-6"
                  />
                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="corp-billing"
                      className="text-brand-900 mb-1.5 block text-sm font-semibold"
                    >
                      Billing Type
                    </label>
                    <select
                      id="corp-billing"
                      value={form.corporate.billingType}
                      onChange={(e) =>
                        onCorporateChange("billingType", e.target.value)
                      }
                      className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
                    >
                      <option value="Corporate Account">
                        Corporate Account
                      </option>
                      <option value="Guest Pays Extras Only">
                        Guest Pays Extras Only
                      </option>
                      <option value="Guest Pays All">Guest Pays All</option>
                    </select>
                  </div>
                  <div className="col-span-6 sm:col-span-3">
                    <Input
                      label="Credit Limit"
                      name="corp-credit"
                      type="number"
                      placeholder="500000"
                      value={form.corporate.creditLimit}
                      onChange={(e) =>
                        onCorporateChange("creditLimit", e.target.value)
                      }
                    />
                  </div>
                  <Input
                    label="Address"
                    name="corp-address"
                    placeholder="Company address"
                    value={form.corporate.address}
                    onChange={(e) =>
                      onCorporateChange("address", e.target.value)
                    }
                    className="col-span-12"
                  />
                  <div className="col-span-12 sm:col-span-6">
                    <Input
                      label="GST Number"
                      name="corp-gst"
                      placeholder="22ABCDE1234F1Z5"
                      value={form.corporate.gstNumber}
                      onChange={(e) =>
                        onCorporateChange("gstNumber", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-3">
                    <Input
                      label="Payment Terms"
                      name="corp-terms"
                      placeholder="30 Days"
                      value={form.corporate.paymentTerms}
                      onChange={(e) =>
                        onCorporateChange("paymentTerms", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-3">
                    <Input
                      label="Cost Center / Department"
                      name="corp-cost"
                      placeholder="IT Department"
                      value={form.corporate.costCenter}
                      onChange={(e) =>
                        onCorporateChange("costCenter", e.target.value)
                      }
                    />
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Step 1: Stay Details */}
            {step === 1 && (
              <StayDetailsSection
                value={form}
                onChange={onChange}
                errors={errors}
                {...sectionState(1)}
              />
            )}

            {/* Step 2: Guest Details — Guest List Grid */}
            {step === 2 && (
              <SectionCard number="3" title="Guest Details">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-brand-900 font-semibold">
                    Guests ({form.guests.length})
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={Plus}
                      onClick={addGuest}
                    >
                      Add Guest
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={FileText}
                      className="border-amber-200 text-amber-700 hover:bg-amber-50"
                    >
                      Import from Excel
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={Download}
                      className="border-amber-200 text-amber-700 hover:bg-amber-50"
                    >
                      Download Template
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-muted-500 px-4 py-2 text-left text-xs font-medium tracking-wider uppercase">
                          #
                        </th>
                        <th className="text-muted-500 px-4 py-2 text-left text-xs font-medium tracking-wider uppercase">
                          Guest Name *
                        </th>
                        <th className="text-muted-500 px-4 py-2 text-left text-xs font-medium tracking-wider uppercase">
                          Email
                        </th>
                        <th className="text-muted-500 px-4 py-2 text-left text-xs font-medium tracking-wider uppercase">
                          Phone
                        </th>
                        <th className="text-muted-500 px-4 py-2 text-left text-xs font-medium tracking-wider uppercase">
                          Designation
                        </th>
                        <th className="text-muted-500 px-4 py-2 text-left text-xs font-medium tracking-wider uppercase">
                          ID Type
                        </th>
                        <th className="text-muted-500 px-4 py-2 text-left text-xs font-medium tracking-wider uppercase">
                          ID Number *
                        </th>
                        <th className="text-muted-500 px-4 py-2 text-left text-xs font-medium tracking-wider uppercase" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {form.guests.length === 0 ? (
                        <tr>
                          <td
                            className="text-muted-500 px-4 py-8 text-center"
                            colSpan="8"
                          >
                            No guests added. Click "Add Guest" to add attendees.
                          </td>
                        </tr>
                      ) : (
                        form.guests.map((g, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="text-muted-500 px-4 py-3 text-sm">
                              {i + 1}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={g.name}
                                onChange={(e) =>
                                  onGuestChange(i, "name", e.target.value)
                                }
                                placeholder="Guest name"
                                className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
                                required
                              />
                              {errors[`guests.${i}.name`] && (
                                <p className="mt-1 text-xs font-medium text-rose-500">
                                  {errors[`guests.${i}.name`]}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="email"
                                value={g.email}
                                onChange={(e) =>
                                  onGuestChange(i, "email", e.target.value)
                                }
                                placeholder="email@company.com"
                                className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="tel"
                                value={g.phone}
                                onChange={(e) =>
                                  onGuestChange(i, "phone", e.target.value)
                                }
                                placeholder="+91 98765 43210"
                                className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={g.designation}
                                onChange={(e) =>
                                  onGuestChange(
                                    i,
                                    "designation",
                                    e.target.value,
                                  )
                                }
                                placeholder="Software Engineer"
                                className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={g.idType}
                                onChange={(e) =>
                                  onGuestChange(i, "idType", e.target.value)
                                }
                                className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
                              >
                                <option value="Aadhaar">Aadhaar</option>
                                <option value="Passport">Passport</option>
                                <option value="Driving License">
                                  Driving License
                                </option>
                                <option value="PAN">PAN</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={g.idNumber}
                                onChange={(e) =>
                                  onGuestChange(i, "idNumber", e.target.value)
                                }
                                placeholder="ID Number"
                                className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
                                required
                              />
                              {errors[`guests.${i}.idNumber`] && (
                                <p className="mt-1 text-xs font-medium text-rose-500">
                                  {errors[`guests.${i}.idNumber`]}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => removeGuest(i)}
                                className="p-1 text-rose-500 hover:text-rose-700"
                                aria-label="Remove guest"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}

            {/* Step 3: Select Room */}
            {step === 3 && (
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
                  {...sectionState(3)}
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

            {/* Step 4: Confirm & Create */}
            {step === 4 && (
              <SectionCard number="5" title="Confirm & Create">
                <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                  <ReviewRow
                    label="Company"
                    value={form.corporate.name || "—"}
                    onEdit={() => setStep(0)}
                  />
                  <ReviewRow
                    label="Contact"
                    value={`${form.corporate.contactPerson || "—"} · ${form.corporate.phonePrefix || "+91"} ${form.corporate.phone || "—"}`}
                    onEdit={() => setStep(0)}
                  />
                  <ReviewRow
                    label="Stay"
                    value={`${formatDate(form.checkIn)} → ${formatDate(form.checkOut)} · ${nightsBetween(form.checkIn, form.checkOut)} night${nightsBetween(form.checkIn, form.checkOut) === 1 ? "" : "s"} · ${form.guests.length} guest${form.guests.length === 1 ? "" : "s"}`}
                    onEdit={() => setStep(1)}
                  />
                  <ReviewRow
                    label="Room Type"
                    value={selectedTypeName || "—"}
                    onEdit={() => setStep(3)}
                  />
                  <ReviewRow
                    label="Rate Plan"
                    value={quote.data?.ratePlan?.name || "Standard rate"}
                    onEdit={() => setStep(3)}
                  />
                  <ReviewRow
                    label="Guests"
                    value={guestsLine}
                    onEdit={() => setStep(2)}
                  />
                  <ReviewRow
                    label="Billing Type"
                    value={form.corporate.billingType || "Corporate Account"}
                    onEdit={() => setStep(0)}
                  />
                  <ReviewRow
                    label="Payment Terms"
                    value={form.corporate.paymentTerms || "30 Days"}
                    onEdit={() => setStep(0)}
                  />
                  <ReviewRow
                    label="Cost Center"
                    value={form.corporate.costCenter || "—"}
                    onEdit={() => setStep(0)}
                  />
                </dl>

                <div className="mt-4">
                  <label
                    htmlFor="discount"
                    className="text-brand-900 mb-1.5 block text-sm font-semibold"
                  >
                    Corporate Discount (% on room charge, before tax)
                  </label>
                  <input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={form.discount}
                    onChange={(e) => onChange("discount", e.target.value)}
                    placeholder="5"
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
              disabled={
                nights < 1 || !form.roomTypeCode || form.guests.length === 0
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
