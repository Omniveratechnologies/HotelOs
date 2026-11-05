import { useState } from "react";
import { Save } from "lucide-react";

import { Modal, Input, Button } from "@hotelos/ui/components";

import { useUpdateHotel, useSetHotelAiosellCode } from "../hooks/useHotels.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditHotelModal({ hotel, onClose, onSaved }) {
  // Local copy initialized directly from the hotel record with zero hardcoded fallbacks
  const [name, setName] = useState(hotel?.name || "");
  const [email, setEmail] = useState(hotel?.email || "");
  const [phone, setPhone] = useState(hotel?.phone || "");
  const [address, setAddress] = useState(hotel?.address || "");
  const [city, setCity] = useState(hotel?.city || "");
  const [state, setState] = useState(hotel?.state || "");
  const [pincode, setPincode] = useState(hotel?.pincode || "");
  const [country, setCountry] = useState(hotel?.country || "India");
  const [currency, setCurrency] = useState(hotel?.currency || "INR");

  const [gstin, setGstin] = useState(hotel?.gstin || "");
  const [taxPercent, setTaxPercent] = useState(
    hotel?.taxPercent != null ? String(hotel.taxPercent) : "",
  );

  const [checkInTime, setCheckInTime] = useState(hotel?.checkInTime || "");
  const [checkOutTime, setCheckOutTime] = useState(hotel?.checkOutTime || "");

  const [wifiNetworkName, setWifiNetworkName] = useState(
    hotel?.wifiNetworkName || "",
  );
  const [wifiPassword, setWifiPassword] = useState(hotel?.wifiPassword || "");

  const [cancellationPolicy, setCancellationPolicy] = useState(
    hotel?.cancellationPolicy || "",
  );
  const [termsAndConditions, setTermsAndConditions] = useState(
    hotel?.termsAndConditions || "",
  );

  const [subscriptionStartDate, setSubscriptionStartDate] = useState(
    hotel?.subscriptionStartDate
      ? hotel.subscriptionStartDate.slice(0, 10)
      : "",
  );
  const [subscriptionEndDate, setSubscriptionEndDate] = useState(
    hotel?.subscriptionEndDate ? hotel.subscriptionEndDate.slice(0, 10) : "",
  );
  const [aiosellHotelCode, setAiosellHotelCode] = useState(
    hotel?.aiosellHotelCode || "",
  );

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const updateHotelMutation = useUpdateHotel();
  const setHotelAiosellCodeMutation = useSetHotelAiosellCode();

  function validate() {
    const next = {};

    if (!name.trim()) {
      next.name = "Hotel name is required.";
    }

    if (!email.trim()) {
      next.email = "Hotel email is required.";
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = "Enter a valid hotel email.";
    }

    if (taxPercent !== "") {
      const parsed = Number(taxPercent);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
        next.taxPercent = "Tax percentage must be between 0 and 100.";
      }
    }

    if (!checkInTime.trim()) {
      next.checkInTime = "Check-in time is required.";
    }

    if (!checkOutTime.trim()) {
      next.checkOutTime = "Check-out time is required.";
    }

    if (
      checkInTime.trim() &&
      checkOutTime.trim() &&
      checkInTime.trim() === checkOutTime.trim()
    ) {
      next.checkOutTime = "Check-out time must differ from check-in time.";
    }

    if (
      subscriptionStartDate &&
      subscriptionEndDate &&
      new Date(subscriptionStartDate) > new Date(subscriptionEndDate)
    ) {
      next.subscriptionEndDate = "End date must be on or after start date.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const updated = await updateHotelMutation.mutateAsync({
        id: hotel._id,
        data: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          country: country.trim() || "India",
          currency: currency.trim() || "INR",
          gstin: gstin.trim().toUpperCase(),
          taxPercent: taxPercent !== "" ? Number(taxPercent) : undefined,
          checkInTime: checkInTime.trim(),
          checkOutTime: checkOutTime.trim(),
          cancellationPolicy: cancellationPolicy.trim(),
          termsAndConditions: termsAndConditions.trim(),
          wifiNetworkName: wifiNetworkName.trim(),
          wifiPassword: wifiPassword.trim(),
          subscriptionStartDate: subscriptionStartDate
            ? new Date(subscriptionStartDate).toISOString()
            : undefined,
          subscriptionEndDate: subscriptionEndDate
            ? new Date(subscriptionEndDate).toISOString()
            : undefined,
        },
      });

      // Aiosell property code lives on its own endpoint — save it separately
      if (aiosellHotelCode.trim() !== (hotel.aiosellHotelCode || "")) {
        await setHotelAiosellCodeMutation.mutateAsync({
          hotelId: hotel._id,
          aiosellHotelCode: aiosellHotelCode.trim() || null,
        });
      }

      onSaved?.({ ...(updated?._id ? updated : hotel), ...updated });
      onClose();
    } catch (error) {
      console.error("Update hotel error:", error);
      setErrors({
        form: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${hotel?.name || "Hotel"}`}
      subtitle="Update profile, operating parameters, taxes, policies, and channel settings."
      maxWidth="3xl"
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[75vh] space-y-6 overflow-y-auto px-1 py-1"
      >
        {/* =============================================
            1. HOTEL BASIC DETAILS
        ============================================= */}
        <div>
          <div className="border-surface-200 border-b pb-2">
            <h3 className="text-brand-900 text-sm font-semibold">
              1. Basic Information
            </h3>
            <p className="text-brand-700/60 text-xs">
              Primary identification and contact details.
            </p>
          </div>

          <div className="mt-3 space-y-3">
            <Input
              label="Hotel Name"
              required
              error={errors.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Hotel Email"
                required
                type="email"
                error={errors.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* =============================================
            2. LOCATION & ADDRESS
        ============================================= */}
        <div>
          <div className="border-surface-200 border-b pb-2">
            <h3 className="text-brand-900 text-sm font-semibold">
              2. Location & Address
            </h3>
            <p className="text-brand-700/60 text-xs">
              Physical address displayed on invoices and registration cards.
            </p>
          </div>

          <div className="mt-3 space-y-3">
            <Input
              label="Street Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />

              <Input
                label="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />

              <Input
                label="Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />

              <Input
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />

              <Input
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* =============================================
            3. TAX & OPERATIONAL SETTINGS
        ============================================= */}
        <div>
          <div className="border-surface-200 border-b pb-2">
            <h3 className="text-brand-900 text-sm font-semibold">
              3. Taxes & Operating Hours
            </h3>
            <p className="text-brand-700/60 text-xs">
              Configure tax percentage and operating hours for reservations.
            </p>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="GSTIN"
              placeholder="e.g. 29AABCU9603R1ZM"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
            />

            <Input
              label="Tax Rate (%)"
              required
              type="number"
              step="any"
              min="0"
              max="100"
              error={errors.taxPercent}
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
              hint="Standard tax rate applied to room charges"
            />

            <Input
              label="Check-in Time"
              required
              type="time"
              error={errors.checkInTime}
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
            />

            <Input
              label="Check-out Time"
              required
              type="time"
              error={errors.checkOutTime}
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
            />
          </div>
        </div>

        {/* =============================================
            4. WIFI & GUEST CONVENIENCES
        ============================================= */}
        <div>
          <div className="border-surface-200 border-b pb-2">
            <h3 className="text-brand-900 text-sm font-semibold">
              4. Guest WiFi
            </h3>
            <p className="text-brand-700/60 text-xs">
              Shared with guests on the digital check-in confirmation screen.
            </p>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input
              label="WiFi Network Name"
              value={wifiNetworkName}
              onChange={(e) => setWifiNetworkName(e.target.value)}
            />

            <Input
              label="WiFi Password"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
            />
          </div>
        </div>

        {/* =============================================
            5. POLICIES & TERMS
        ============================================= */}
        <div>
          <div className="border-surface-200 border-b pb-2">
            <h3 className="text-brand-900 text-sm font-semibold">
              5. Policies & Legal
            </h3>
            <p className="text-brand-700/60 text-xs">
              Rendered on Guest Registration Cards (GRC) and booking summaries.
            </p>
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <label className="text-brand-900 mb-1.5 block text-sm font-semibold">
                Cancellation Policy
              </label>
              <textarea
                rows={2}
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
                className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition outline-none placeholder:text-gray-400 focus:ring-2"
              />
            </div>

            <div>
              <label className="text-brand-900 mb-1.5 block text-sm font-semibold">
                Terms & Conditions
              </label>
              <textarea
                rows={2}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition outline-none placeholder:text-gray-400 focus:ring-2"
              />
            </div>
          </div>
        </div>

        {/* =============================================
            6. SUBSCRIPTION & CHANNELS
        ============================================= */}
        <div>
          <div className="border-surface-200 border-b pb-2">
            <h3 className="text-brand-900 text-sm font-semibold">
              6. Subscription & Channel Manager
            </h3>
            <p className="text-brand-700/60 text-xs">
              Subscription window and Aiosell property synchronization.
            </p>
          </div>

          <div className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Subscription Start"
                type="date"
                error={errors.subscriptionStartDate}
                value={subscriptionStartDate}
                onChange={(e) => setSubscriptionStartDate(e.target.value)}
              />

              <Input
                label="Subscription End"
                type="date"
                error={errors.subscriptionEndDate}
                value={subscriptionEndDate}
                onChange={(e) => setSubscriptionEndDate(e.target.value)}
              />
            </div>

            <Input
              label="Aiosell Property Code"
              placeholder="e.g. sandbox-pms"
              value={aiosellHotelCode}
              onChange={(e) => setAiosellHotelCode(e.target.value)}
            />
          </div>
        </div>

        {/* =============================================
            FORM LEVEL ERROR
        ============================================= */}
        {errors.form && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-600">
            {errors.form}
          </p>
        )}

        {/* =============================================
            ACTIONS
        ============================================= */}
        <div className="border-surface-200 sticky bottom-0 flex justify-end gap-3 border-t bg-white pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button type="submit" icon={Save} disabled={submitting}>
            {submitting ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
