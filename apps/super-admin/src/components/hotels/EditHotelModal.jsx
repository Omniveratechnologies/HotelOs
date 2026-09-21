import { useState } from "react";
import { Save } from "lucide-react";

import Modal from "../ui/Modal.jsx";
import Field from "../ui/Field.jsx";
import { inputClass } from "../ui/inputClass.js";
import Button from "../ui/Button.jsx";

import {
  updateHotelDetails,
  setHotelAiosellCode,
} from "../../services/hotel.service.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditHotelModal({ hotel, onClose, onSaved }) {
  // Local copy initialized from the hotel being edited
  // (component is remounted by the parent for each selection)
  const [name, setName] = useState(hotel?.name || "");
  const [email, setEmail] = useState(hotel?.email || "");
  const [phone, setPhone] = useState(hotel?.phone || "");
  const [address, setAddress] = useState(hotel?.address || "");
  const [city, setCity] = useState(hotel?.city || "");
  const [checkInTime, setCheckInTime] = useState(hotel?.checkInTime || "14:00");
  const [checkOutTime, setCheckOutTime] = useState(
    hotel?.checkOutTime || "12:00",
  );
  const [wifiNetworkName, setWifiNetworkName] = useState(
    hotel?.wifiNetworkName || "",
  );
  const [wifiPassword, setWifiPassword] = useState(hotel?.wifiPassword || "");
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

    if (
      subscriptionStartDate &&
      subscriptionEndDate &&
      new Date(subscriptionEndDate) <= new Date(subscriptionStartDate)
    ) {
      next.subscriptionEndDate = "End date must be after the start date.";
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
      const updated = await updateHotelDetails(hotel._id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        checkInTime: checkInTime.trim() || "14:00",
        checkOutTime: checkOutTime.trim() || "12:00",
        wifiNetworkName: wifiNetworkName.trim() || undefined,
        wifiPassword: wifiPassword.trim() || undefined,
        subscriptionStartDate: subscriptionStartDate
          ? new Date(subscriptionStartDate).toISOString()
          : undefined,
        subscriptionEndDate: subscriptionEndDate
          ? new Date(subscriptionEndDate).toISOString()
          : undefined,
      });

      // Aiosell property code lives on its own endpoint — save it separately
      await setHotelAiosellCode(hotel._id, aiosellHotelCode.trim());

      onSaved?.({ ...(updated._id ? updated : hotel), ...updated });
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
      onClose={onClose}
      title={`Edit ${hotel?.name || "hotel"}`}
      subtitle="Update the hotel's profile, subscription and channel details."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-surface-200 border-b pb-4">
          <h3 className="text-brand-900 text-sm font-semibold">
            Hotel details
          </h3>
          <p className="text-brand-700/60 mt-1 text-xs">
            Manage the property's public information.
          </p>
        </div>

        <Field label="Hotel name" error={errors.name}>
          <input
            className={inputClass(errors.name)}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hotel email" error={errors.email}>
            <input
              type="email"
              className={inputClass(errors.email)}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Phone number">
            <input
              type="tel"
              className={inputClass()}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Address">
          <input
            className={inputClass()}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City">
            <input
              className={inputClass()}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </Field>

          <Field label="Aiosell property code">
            <input
              className={inputClass()}
              placeholder="e.g. sandbox-pms"
              value={aiosellHotelCode}
              onChange={(e) => setAiosellHotelCode(e.target.value)}
            />
          </Field>
        </div>

        <div className="border-surface-200 border-b pb-4">
          <h3 className="text-brand-900 text-sm font-semibold">Operations</h3>
          <p className="text-brand-700/60 mt-1 text-xs">
            Check-in/out times and guest WiFi details.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Check-in time">
            <input
              type="time"
              className={inputClass()}
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
            />
          </Field>

          <Field label="Check-out time">
            <input
              type="time"
              className={inputClass()}
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WiFi network name">
            <input
              className={inputClass()}
              value={wifiNetworkName}
              onChange={(e) => setWifiNetworkName(e.target.value)}
            />
          </Field>

          <Field label="WiFi password">
            <input
              className={inputClass()}
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
            />
          </Field>
        </div>

        <div className="border-surface-200 border-b pb-4">
          <h3 className="text-brand-900 text-sm font-semibold">Subscription</h3>
          <p className="text-brand-700/60 mt-1 text-xs">
            The hotel's active subscription window.
          </p>
        </div>

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

        {errors.form && (
          <p className="rounded-lg bg-rose-100 px-3.5 py-2.5 text-xs font-medium text-rose-500">
            {errors.form}
          </p>
        )}

        <div className="flex justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button type="submit" icon={Save} disabled={submitting}>
            {submitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
