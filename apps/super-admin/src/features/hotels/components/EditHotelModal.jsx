import { useState } from "react";
import { Save } from "lucide-react";

import { Modal, Input, Button } from "@hotelos/ui/components";

import { useUpdateHotel, useSetHotelAiosellCode } from "../hooks/useHotels.js";

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

    if (
      subscriptionStartDate &&
      subscriptionEndDate &&
      new Date(subscriptionStartDate) > new Date(subscriptionEndDate)
    ) {
      next.subscriptionEndDate = "End date must be on or after start date.";
    }

    if (checkInTime && checkOutTime && checkInTime === checkOutTime) {
      next.checkOutTime = "Check-out time must differ from check-in time.";
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
        },
      });

      // Aiosell property code lives on its own endpoint — save it separately
      if (aiosellHotelCode.trim()) {
        await setHotelAiosellCodeMutation.mutateAsync({
          hotelId: hotel._id,
          aiosellHotelCode: aiosellHotelCode.trim(),
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

        <Input
          label="Hotel name"
          error={errors.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Hotel email"
            type="email"
            error={errors.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Phone number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <Input
            label="Aiosell property code"
            placeholder="e.g. sandbox-pms"
            value={aiosellHotelCode}
            onChange={(e) => setAiosellHotelCode(e.target.value)}
          />
        </div>

        <div className="border-surface-200 border-b pb-4">
          <h3 className="text-brand-900 text-sm font-semibold">Operations</h3>
          <p className="text-brand-700/60 mt-1 text-xs">
            Check-in/out times and guest WiFi details.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Check-in time"
            type="time"
            value={checkInTime}
            onChange={(e) => setCheckInTime(e.target.value)}
          />

          <Input
            label="Check-out time"
            type="time"
            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="WiFi network name"
            value={wifiNetworkName}
            onChange={(e) => setWifiNetworkName(e.target.value)}
          />

          <Input
            label="WiFi password"
            value={wifiPassword}
            onChange={(e) => setWifiPassword(e.target.value)}
          />
        </div>

        <div className="border-surface-200 border-b pb-4">
          <h3 className="text-brand-900 text-sm font-semibold">Subscription</h3>
          <p className="text-brand-700/60 mt-1 text-xs">
            The hotel's active subscription window.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Subscription start"
            type="date"
            error={errors.subscriptionStartDate}
            value={subscriptionStartDate}
            onChange={(e) => setSubscriptionStartDate(e.target.value)}
          />

          <Input
            label="Subscription end"
            type="date"
            error={errors.subscriptionEndDate}
            value={subscriptionEndDate}
            onChange={(e) => setSubscriptionEndDate(e.target.value)}
          />
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
