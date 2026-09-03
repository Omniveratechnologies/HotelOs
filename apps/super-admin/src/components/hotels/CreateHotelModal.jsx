import { useState } from "react";
import { Send } from "lucide-react";

import Modal from "../ui/Modal.jsx";
import Field from "../ui/Field.jsx";
import { inputClass } from "../ui/inputClass.js";
import Button from "../ui/Button.jsx";

import {
  createNewHotel,
  sendSubAdminInvite,
} from "../../services/hotel.service.js";

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

  const [subscriptionStartDate, setSubscriptionStartDate] = useState("");

  const [subscriptionEndDate, setSubscriptionEndDate] = useState("");

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

  // =====================================================
  // RESET FORM
  // =====================================================

  function resetForm() {
    // Hotel
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");

    setSubscriptionStartDate("");
    setSubscriptionEndDate("");

    // Sub Admin
    setAdminName("");
    setAdminUsername("");
    setAdminEmail("");

    // Errors
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
      next.email = "Enter a valid hotel email.";
    }

    // Subscription

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

    // Sub Admin name

    if (!adminName.trim()) {
      next.adminName = "Sub Admin name is required.";
    }

    // Sub Admin username

    if (!adminUsername.trim()) {
      next.adminUsername = "Sub Admin username is required.";
    } else if (adminUsername.trim().length < 3) {
      next.adminUsername = "Username must be at least 3 characters.";
    }

    // Sub Admin email

    if (!adminEmail.trim()) {
      next.adminEmail = "Sub Admin email is required.";
    } else if (!EMAIL_RE.test(adminEmail.trim())) {
      next.adminEmail = "Enter a valid Sub Admin email.";
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
      // =================================================
      // STEP 1
      // CREATE HOTEL
      // =================================================

      const hotel = await createNewHotel({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        subscriptionStartDate,
        subscriptionEndDate,
      });

      console.log("Hotel created:", hotel);

      if (!hotel || !hotel._id) {
        throw new Error(
          "Hotel was created, but the hotel ID was not returned.",
        );
      }

      // =================================================
      // STEP 2
      // CREATE SUB ADMIN + SEND INVITATION
      // =================================================

      const invitation = await sendSubAdminInvite({
        name: adminName.trim(),

        username: adminUsername.trim().toLowerCase(),

        email: adminEmail.trim().toLowerCase(),

        hotelId: hotel._id,

        subscriptionStartDate,

        subscriptionEndDate,
      });

      console.log("Sub Admin invitation sent:", invitation);

      // =================================================
      // STEP 3
      // UPDATE HOTELS PAGE
      // =================================================

      onCreated?.(hotel, {
        invited: true,
        adminEmail: adminEmail.trim(),
      });

      // =================================================
      // STEP 4
      // RESET AND CLOSE
      // =================================================

      resetAndClose();
    } catch (error) {
      console.error("Create hotel / invite error:", error);

      setErrors({
        form: error.message || "Something went wrong. Please try again.",
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
      title="Create a hotel"
      subtitle="Create the hotel and send an invitation to its Sub Admin."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* =============================================
            HOTEL DETAILS
        ============================================= */}

        <div className="border-line border-b pb-4">
          <h3 className="text-ink-body text-sm font-semibold">Hotel details</h3>

          <p className="text-ink-muted mt-1 text-xs">
            Basic information about the hotel.
          </p>
        </div>

        {/* HOTEL NAME */}

        <Field label="Hotel name" error={errors.name}>
          <input
            className={inputClass(errors.name)}
            placeholder="e.g. The Grand Meridian"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Field>

        {/* HOTEL EMAIL */}

        <Field label="Hotel email" error={errors.email}>
          <input
            type="email"
            className={inputClass(errors.email)}
            placeholder="hotel@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        {/* PHONE */}

        <Field label="Phone number">
          <input
            type="tel"
            className={inputClass()}
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>

        {/* ADDRESS */}

        <Field label="Address">
          <input
            className={inputClass()}
            placeholder="Hotel address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>

        {/* CITY */}

        <Field label="City">
          <input
            className={inputClass()}
            placeholder="e.g. Kolkata"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </Field>

        {/* SUBSCRIPTION */}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Subscription start"
            error={errors.subscriptionStartDate}
          >
            <input
              type="date"
              className={inputClass(errors.subscriptionStartDate)}
              value={subscriptionStartDate}
              onChange={(e) => setSubscriptionStartDate(e.target.value)}
            />
          </Field>

          <Field label="Subscription end" error={errors.subscriptionEndDate}>
            <input
              type="date"
              className={inputClass(errors.subscriptionEndDate)}
              value={subscriptionEndDate}
              onChange={(e) => setSubscriptionEndDate(e.target.value)}
            />
          </Field>
        </div>

        {/* =============================================
            SUB ADMIN DETAILS
        ============================================= */}

        <div className="border-line border-t pt-5">
          <h3 className="text-ink-body text-sm font-semibold">
            Hotel Sub Admin
          </h3>

          <p className="text-ink-muted mt-1 text-xs">
            This person will receive an invitation email and manage the hotel
            account.
          </p>
        </div>

        {/* SUB ADMIN NAME */}

        <Field label="Sub Admin name" error={errors.adminName}>
          <input
            className={inputClass(errors.adminName)}
            placeholder="e.g. Rahul Sharma"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
          />
        </Field>

        {/* USERNAME */}

        <Field label="Username" error={errors.adminUsername}>
          <input
            className={inputClass(errors.adminUsername)}
            placeholder="e.g. rahulsharma"
            value={adminUsername}
            onChange={(e) => setAdminUsername(e.target.value)}
          />
        </Field>

        {/* SUB ADMIN EMAIL */}

        <Field
          label="Sub Admin email"
          error={errors.adminEmail}
          hint={
            !errors.adminEmail
              ? "The invitation link will be sent to this email."
              : undefined
          }
        >
          <input
            type="email"
            className={inputClass(errors.adminEmail)}
            placeholder="admin@hotel.com"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
          />
        </Field>

        {/* =============================================
            ERROR
        ============================================= */}

        {errors.form && (
          <p className="rounded-lg bg-rose-100 px-3.5 py-2.5 text-xs font-medium text-rose-500">
            {errors.form}
          </p>
        )}

        {/* =============================================
            BUTTONS
        ============================================= */}

        <div className="flex justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={resetAndClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button type="submit" icon={Send} disabled={submitting}>
            {submitting ? "Creating..." : "Create & send invite"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
