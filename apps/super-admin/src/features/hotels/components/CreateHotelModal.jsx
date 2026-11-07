import { useState } from "react";
import { Send } from "lucide-react";

import { Modal, Input, Button } from "@hotelos/ui/components";

import { useCreateHotel } from "../hooks/useHotels.js";
import { invitationsApi } from "@hotelos/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateHotelModal({ open, onClose, onCreated }) {
  // =====================================================
  // HOTEL STATE
  // =====================================================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");
  const [currency, setCurrency] = useState("INR");

  const [gstin, setGstin] = useState("");
  const [taxPercent, setTaxPercent] = useState("");

  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");

  const [wifiNetworkName, setWifiNetworkName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");

  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");

  const [subscriptionStartDate, setSubscriptionStartDate] = useState("");
  const [subscriptionEndDate, setSubscriptionEndDate] = useState("");

  const [aiosellHotelCode, setAiosellHotelCode] = useState("");

  // =====================================================
  // SUB ADMIN STATE
  // =====================================================

  const [adminName, setAdminName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  // =====================================================
  // FORM STATE
  // =====================================================

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const createHotelMutation = useCreateHotel();

  // =====================================================
  // RESET FORM
  // =====================================================

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");
    setState("");
    setPincode("");
    setCountry("India");
    setCurrency("INR");

    setGstin("");
    setTaxPercent("");
    setCheckInTime("");
    setCheckOutTime("");

    setWifiNetworkName("");
    setWifiPassword("");
    setCancellationPolicy("");
    setTermsAndConditions("");

    setSubscriptionStartDate("");
    setSubscriptionEndDate("");
    setAiosellHotelCode("");

    setAdminName("");
    setAdminUsername("");
    setAdminEmail("");

    setErrors({});
  }

  function resetAndClose() {
    resetForm();
    onClose();
  }

  // =====================================================
  // VALIDATION
  // =====================================================

  function validate() {
    const next = {};

    // Hotel name
    if (!name.trim()) {
      next.name = "Hotel name is required.";
    }

    // Hotel email
    if (!email.trim()) {
      next.email = "Hotel email is required.";
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = "Enter a valid hotel email address.";
    }

    // Tax percentage (Required, no fallback)
    const parsedTax = Number(taxPercent);
    if (!taxPercent.trim()) {
      next.taxPercent = "Tax percentage is required (e.g. 12 or 18).";
    } else if (Number.isNaN(parsedTax) || parsedTax < 0 || parsedTax > 100) {
      next.taxPercent = "Enter a valid tax percentage between 0 and 100.";
    }

    // Check-in and check-out times (Required, no fallback)
    if (!checkInTime.trim()) {
      next.checkInTime = "Check-in time is required (e.g. 14:00).";
    }

    if (!checkOutTime.trim()) {
      next.checkOutTime = "Check-out time is required (e.g. 12:00).";
    }

    if (
      checkInTime.trim() &&
      checkOutTime.trim() &&
      checkInTime.trim() === checkOutTime.trim()
    ) {
      next.checkOutTime = "Check-out time must differ from check-in time.";
    }

    // Subscription dates
    if (!subscriptionStartDate) {
      next.subscriptionStartDate = "Subscription start date is required.";
    }

    if (!subscriptionEndDate) {
      next.subscriptionEndDate = "Subscription end date is required.";
    }

    if (
      subscriptionStartDate &&
      subscriptionEndDate &&
      new Date(subscriptionEndDate) <= new Date(subscriptionStartDate)
    ) {
      next.subscriptionEndDate = "End date must be after the start date.";
    }

    // Sub Admin credentials
    if (!adminName.trim()) {
      next.adminName = "Sub Admin name is required.";
    }

    if (!adminUsername.trim()) {
      next.adminUsername = "Sub Admin username is required.";
    } else if (adminUsername.trim().length < 3) {
      next.adminUsername = "Username must be at least 3 characters.";
    }

    if (!adminEmail.trim()) {
      next.adminEmail = "Sub Admin email is required.";
    } else if (!EMAIL_RE.test(adminEmail.trim())) {
      next.adminEmail = "Enter a valid Sub Admin email address.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // =====================================================
  // CREATE HOTEL + INVITE SUB ADMIN
  // =====================================================

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      // Step 1: Create Hotel in DB
      const hotel = await createHotelMutation.mutateAsync({
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
        taxPercent: Number(taxPercent),
        checkInTime: checkInTime.trim(),
        checkOutTime: checkOutTime.trim(),
        cancellationPolicy: cancellationPolicy.trim(),
        termsAndConditions: termsAndConditions.trim(),
        wifiNetworkName: wifiNetworkName.trim(),
        wifiPassword: wifiPassword.trim(),
        subscriptionStartDate,
        subscriptionEndDate,
        aiosellHotelCode: aiosellHotelCode.trim() || undefined,
      });

      if (!hotel || !hotel._id) {
        throw new Error(
          "Hotel was created, but the hotel ID was not returned.",
        );
      }

      // Step 2: Send Sub Admin Invitation
      await invitationsApi.sendSubAdminInvite({
        name: adminName.trim(),
        username: adminUsername.trim().toLowerCase(),
        email: adminEmail.trim().toLowerCase(),
        hotelId: hotel._id,
        subscriptionStartDate,
        subscriptionEndDate,
      });

      // Step 3: Callback & Close
      onCreated?.(hotel, {
        invited: true,
        adminEmail: adminEmail.trim(),
      });

      resetAndClose();
    } catch (error) {
      console.error("Create hotel / invite error:", error);
      setErrors({
        form: error.message || "Failed to create hotel. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="Create New Hotel"
      subtitle="Register property details, tax & operational policies, and invite the Sub Admin."
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
              placeholder="e.g. The Grand Meridian"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Hotel Email"
                required
                type="email"
                error={errors.email}
                placeholder="contact@hotelmeridian.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="e.g. +91 98765 43210"
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
              placeholder="e.g. 12, MG Road, Central District"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                label="City"
                placeholder="e.g. Bengaluru"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />

              <Input
                label="State"
                placeholder="e.g. Karnataka"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />

              <Input
                label="Pincode"
                placeholder="e.g. 560001"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />

              <Input
                label="Country"
                placeholder="e.g. India"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
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
              Configure default tax percentage and operating hours for
              reservations.
            </p>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="GSTIN"
              placeholder="e.g. 29AABCU9603R1ZM"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              hint="15-character GST number"
            />

            <Input
              label="Tax Rate (%)"
              required
              type="number"
              step="any"
              min="0"
              max="100"
              error={errors.taxPercent}
              placeholder="e.g. 12"
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
              hint="Standard check-in time"
            />

            <Input
              label="Check-out Time"
              required
              type="time"
              error={errors.checkOutTime}
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              hint="Standard check-out time"
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
              placeholder="e.g. Meridian-Guest"
              value={wifiNetworkName}
              onChange={(e) => setWifiNetworkName(e.target.value)}
            />

            <Input
              label="WiFi Password"
              placeholder="e.g. Welcome2026"
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
                placeholder="e.g. Free cancellation up to 24 hours prior to check-in. Non-refundable thereafter."
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
                placeholder="e.g. Valid government photo ID required at check-in. Hotel reserves right of admission."
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
              Active subscription period and optional OTA channel sync code.
            </p>
          </div>

          <div className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Subscription Start"
                required
                type="date"
                error={errors.subscriptionStartDate}
                value={subscriptionStartDate}
                onChange={(e) => setSubscriptionStartDate(e.target.value)}
              />

              <Input
                label="Subscription End"
                required
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
              hint="Optional property code used for channel manager synchronization"
            />
          </div>
        </div>

        {/* =============================================
            7. SUB ADMIN ACCOUNT
        ============================================= */}
        <div>
          <div className="border-surface-200 border-b pb-2">
            <h3 className="text-brand-900 text-sm font-semibold">
              7. Sub Admin Account
            </h3>
            <p className="text-brand-700/60 text-xs">
              An invitation email will be sent to this administrator to manage
              the property.
            </p>
          </div>

          <div className="mt-3 space-y-3">
            <Input
              label="Sub Admin Full Name"
              required
              error={errors.adminName}
              placeholder="e.g. Rahul Sharma"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Username"
                required
                error={errors.adminUsername}
                placeholder="e.g. rahulsharma"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
              />

              <Input
                label="Sub Admin Email"
                required
                type="email"
                error={errors.adminEmail}
                placeholder="admin@hotelmeridian.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </div>
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
            onClick={resetAndClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button type="submit" icon={Send} disabled={submitting}>
            {submitting ? "Creating Hotel..." : "Create & Send Invitation"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
