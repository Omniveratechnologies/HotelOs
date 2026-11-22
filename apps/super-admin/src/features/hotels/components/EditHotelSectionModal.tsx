import React, { useState } from "react";
import { Save } from "lucide-react";
import { Modal, Input, Button } from "@hotelos/ui/components";
import { ApiError } from "@hotelos/api";
import { useUpdateHotel } from "../hooks/useHotels.js";
import type { Hotel, HotelEditSection } from "../types.ts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeToTimeInput(timeStr?: string | null): string {
  if (!timeStr) return "";
  const trimmed = timeStr.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return "";
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const modifier = match[3]?.toUpperCase();
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

interface ValidationPayload {
  body?: Record<string, string>;
  query?: Record<string, string>;
  params?: Record<string, string>;
}

function mapValidationErrors(
  validationErrors?: ValidationPayload,
): Record<string, string> {
  if (!validationErrors) return {};

  const mapped: Record<string, string> = {};

  if (validationErrors.body) {
    Object.assign(mapped, validationErrors.body);
  }

  if (validationErrors.query) {
    for (const [field, messages] of Object.entries(validationErrors.query)) {
      mapped[`query.${field}`] = messages;
    }
  }

  if (validationErrors.params) {
    for (const [field, messages] of Object.entries(validationErrors.params)) {
      mapped[`params.${field}`] = messages;
    }
  }

  return mapped;
}

export interface EditHotelSectionModalProps {
  hotel: Hotel;
  section: HotelEditSection | null;
  open: boolean;
  onClose: () => void;
  onSaved?: (updatedHotel?: Hotel) => void;
}

const SECTION_METADATA: Record<
  HotelEditSection,
  { title: string; description: string }
> = {
  identity: {
    title: "Edit Identity & System Codes",
    description:
      "Update hotel property name and external channel integration codes.",
  },
  contact: {
    title: "Edit Location & Contact Details",
    description:
      "Update property contact email, phone number, and physical address.",
  },
  tax: {
    title: "Edit Taxation & Currency",
    description:
      "Update GST identification number, tax percentage rate, and billing currency.",
  },
  operations: {
    title: "Edit Operations & Wi-Fi",
    description:
      "Configure standard guest check-in/out times and guest Wi-Fi credentials.",
  },
  policies: {
    title: "Edit Policies & Terms",
    description:
      "Update property cancellation rules, check-in terms, and house policies.",
  },
  subscription: {
    title: "Modify Subscription Dates",
    description: "Update subscription license start and expiration dates.",
  },
};

const EditHotelSectionModalContent: React.FC<{
  hotel: Hotel;
  section: HotelEditSection;
  onClose: () => void;
  onSaved?: (updatedHotel?: Hotel) => void;
}> = ({ hotel, section, onClose, onSaved }) => {
  // Identity fields
  const [name, setName] = useState(hotel.name || "");
  const [aiosellHotelCode, setAiosellHotelCode] = useState(
    hotel.aiosellHotelCode || "",
  );

  // Contact fields
  const [email, setEmail] = useState(hotel.email || "");
  const [phone, setPhone] = useState(hotel.phone || "");
  const [address, setAddress] = useState(hotel.address || "");
  const [city, setCity] = useState(hotel.city || "");
  const [state, setState] = useState(hotel.state || "");
  const [pincode, setPincode] = useState(hotel.pincode || "");
  const [country, setCountry] = useState(hotel.country || "India");

  // Tax fields
  const [gstin, setGstin] = useState(hotel.gstin || "");
  const [taxPercent, setTaxPercent] = useState(
    hotel.taxPercent != null ? String(hotel.taxPercent) : "",
  );
  const [currency, setCurrency] = useState(hotel.currency || "INR");

  // Operations fields
  const [checkInTime, setCheckInTime] = useState(
    normalizeToTimeInput(hotel.checkInTime) || "14:00",
  );
  const [checkOutTime, setCheckOutTime] = useState(
    normalizeToTimeInput(hotel.checkOutTime) || "11:00",
  );
  const [wifiNetworkName, setWifiNetworkName] = useState(
    hotel.wifiNetworkName || "",
  );
  const [wifiPassword, setWifiPassword] = useState(hotel.wifiPassword || "");

  // Policies fields
  const [cancellationPolicy, setCancellationPolicy] = useState(
    hotel.cancellationPolicy || "",
  );
  const [termsAndConditions, setTermsAndConditions] = useState(
    hotel.termsAndConditions || "",
  );

  // Subscription fields
  const [subscriptionStartDate, setSubscriptionStartDate] = useState(
    hotel.subscriptionStartDate ? hotel.subscriptionStartDate.slice(0, 10) : "",
  );
  const [subscriptionEndDate, setSubscriptionEndDate] = useState(
    hotel.subscriptionEndDate ? hotel.subscriptionEndDate.slice(0, 10) : "",
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const updateHotelMutation = useUpdateHotel();

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (section === "identity") {
      if (!name.trim()) errs.name = "Hotel name is required";
    }

    if (section === "contact") {
      if (!email.trim()) {
        errs.email = "Email is required";
      } else if (!EMAIL_RE.test(email.trim())) {
        errs.email = "Enter a valid email address";
      }
    }

    if (section === "tax") {
      if (taxPercent.trim()) {
        const num = Number(taxPercent);
        if (Number.isNaN(num) || num < 0 || num > 100) {
          errs.taxPercent = "Tax % must be a number between 0 and 100";
        }
      }
    }

    if (section === "operations") {
      if (checkInTime && checkOutTime && checkInTime === checkOutTime) {
        errs.checkOutTime = "Check-out time must differ from check-in time";
      }
    }

    if (section === "subscription") {
      if (subscriptionStartDate && subscriptionEndDate) {
        if (new Date(subscriptionEndDate) <= new Date(subscriptionStartDate)) {
          errs.subscriptionEndDate = "Expiry date must be after start date";
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const payload: Record<string, unknown> = {};

      if (section === "identity") {
        payload.name = name.trim();
        payload.aiosellHotelCode = aiosellHotelCode.trim() || null;
      } else if (section === "contact") {
        payload.email = email.trim();
        payload.phone = phone.trim();
        payload.address = address.trim();
        payload.city = city.trim();
        payload.state = state.trim();
        payload.pincode = pincode.trim();
        payload.country = country.trim();
      } else if (section === "tax") {
        payload.gstin = gstin.trim();
        payload.currency = currency.trim() || "INR";
        payload.taxPercent = taxPercent.trim() ? Number(taxPercent) : 0;
      } else if (section === "operations") {
        if (checkInTime && /^\d{2}:\d{2}$/.test(checkInTime)) {
          payload.checkInTime = checkInTime;
        }
        if (checkOutTime && /^\d{2}:\d{2}$/.test(checkOutTime)) {
          payload.checkOutTime = checkOutTime;
        }
        payload.wifiNetworkName = wifiNetworkName.trim() || null;
        payload.wifiPassword = wifiPassword.trim() || null;
      } else if (section === "policies") {
        payload.cancellationPolicy = cancellationPolicy.trim();
        payload.termsAndConditions = termsAndConditions.trim();
      } else if (section === "subscription") {
        if (subscriptionStartDate) {
          payload.subscriptionStartDate = new Date(
            subscriptionStartDate,
          ).toISOString();
        }
        if (subscriptionEndDate) {
          payload.subscriptionEndDate = new Date(
            subscriptionEndDate,
          ).toISOString();
        }
      }

      const updated = (await updateHotelMutation.mutateAsync({
        id: hotel._id,
        data: payload,
      })) as Hotel;

      onSaved?.(updated);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const bodyErrors = mapValidationErrors(
          err.validationErrors as ValidationPayload | undefined,
        );
        if (Object.keys(bodyErrors).length > 0) {
          setErrors(bodyErrors);
        } else {
          setErrors({ form: err.message || "Failed to save changes" });
        }
      } else if (err instanceof Error) {
        setErrors({ form: err.message });
      } else {
        setErrors({ form: "An unexpected error occurred. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const meta = SECTION_METADATA[section];

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={meta.title}
      subtitle={meta.description}
      maxWidth={section === "policies" ? "lg" : "md"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {errors.form}
          </div>
        )}

        {/* SECTION 1: IDENTITY */}
        {section === "identity" && (
          <div className="space-y-4">
            <Input
              label="Hotel Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="e.g. Grand Palace Hotel"
              required
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Hotel Code (Internal ID)
              </label>
              <input
                type="text"
                disabled
                value={hotel.hotelCode || "—"}
                className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 font-mono text-sm text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                System-generated unique identifier cannot be modified.
              </p>
            </div>
            <Input
              label="Aiosell Channel Manager Code"
              value={aiosellHotelCode}
              onChange={(e) => setAiosellHotelCode(e.target.value)}
              error={errors.aiosellHotelCode}
              placeholder="e.g. AIOS_10293"
            />
          </div>
        )}

        {/* SECTION 2: CONTACT & LOCATION */}
        {section === "contact" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Contact Email *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="contact@hotel.com"
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
                placeholder="+91 9876543210"
              />
            </div>
            <Input
              label="Street Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              error={errors.address}
              placeholder="123 Ocean View Road"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                error={errors.city}
                placeholder="Mumbai"
              />
              <Input
                label="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                error={errors.state}
                placeholder="Maharashtra"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Postal Code (Pincode)"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                error={errors.pincode}
                placeholder="400001"
              />
              <Input
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                error={errors.country}
                placeholder="India"
              />
            </div>
          </div>
        )}

        {/* SECTION 3: TAX & BILLING */}
        {section === "tax" && (
          <div className="space-y-4">
            <Input
              label="GSTIN (Tax ID)"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              error={errors.gstin}
              placeholder="27ABCDE1234F1Z5"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Tax Percentage (GST %)"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                error={errors.taxPercent}
                placeholder="e.g. 18"
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Billing Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:ring-1 focus:outline-none"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: OPERATIONS & WI-FI */}
        {section === "operations" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Standard Check-in Time
                </label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:ring-1 focus:outline-none"
                />
                {errors.checkInTime && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.checkInTime}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Standard Check-out Time
                </label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:ring-1 focus:outline-none"
                />
                {errors.checkOutTime && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.checkOutTime}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Guest Wi-Fi Network (SSID)"
                value={wifiNetworkName}
                onChange={(e) => setWifiNetworkName(e.target.value)}
                error={errors.wifiNetworkName}
                placeholder="e.g. HotelGuest_HighSpeed"
              />
              <Input
                label="Guest Wi-Fi Password"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                error={errors.wifiPassword}
                placeholder="e.g. Welcome2026"
              />
            </div>
          </div>
        )}

        {/* SECTION 5: POLICIES & TERMS */}
        {section === "policies" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Cancellation Policy
              </label>
              <textarea
                rows={4}
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
                className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800 shadow-sm focus:ring-1 focus:outline-none"
                placeholder="Free cancellation up to 24 hours before check-in..."
              />
              {errors.cancellationPolicy && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.cancellationPolicy}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Terms and Conditions
              </label>
              <textarea
                rows={4}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800 shadow-sm focus:ring-1 focus:outline-none"
                placeholder="Standard guest rules, check-in ID requirements..."
              />
              {errors.termsAndConditions && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.termsAndConditions}
                </p>
              )}
            </div>
          </div>
        )}

        {/* SECTION 6: SUBSCRIPTION */}
        {section === "subscription" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Subscription Start Date
                </label>
                <input
                  type="date"
                  value={subscriptionStartDate}
                  onChange={(e) => setSubscriptionStartDate(e.target.value)}
                  className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:ring-1 focus:outline-none"
                />
                {errors.subscriptionStartDate && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.subscriptionStartDate}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Subscription Expiry Date
                </label>
                <input
                  type="date"
                  value={subscriptionEndDate}
                  onChange={(e) => setSubscriptionEndDate(e.target.value)}
                  className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:ring-1 focus:outline-none"
                />
                {errors.subscriptionEndDate && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.subscriptionEndDate}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            icon={Save}
            loading={submitting}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const EditHotelSectionModal: React.FC<EditHotelSectionModalProps> = ({
  hotel,
  section,
  open,
  onClose,
  onSaved,
}) => {
  if (!open || !section || !hotel) return null;

  return (
    <EditHotelSectionModalContent
      key={`${hotel._id}-${section}`}
      hotel={hotel}
      section={section}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
};

export default EditHotelSectionModal;
