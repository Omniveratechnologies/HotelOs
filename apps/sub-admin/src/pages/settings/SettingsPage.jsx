import { useEffect, useState } from "react";
import { Header } from "@hotelos/ui/components/Header";

import Button from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";

import { getMyHotel, updateMyHotel } from "../../services/hotel.service.js";

const sliceDate = (value) => (value ? String(value).slice(0, 10) : "");

export default function SettingsPage() {
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [draft, setDraft] = useState({});
  const [original, setOriginal] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getMyHotel();

        if (!cancelled) {
          setHotel(data);
          setDraft(data || {});
          setOriginal(data || {});
          setLoadError("");
        }
      } catch (error) {
        console.error("Failed to load hotel:", error);

        if (!cancelled) {
          setLoadError(error.message || "Failed to load hotel details");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  function setField(field, value) {
    setDraft((previous) => ({ ...previous, [field]: value }));
  }

  const valueOf = (field, fallback = "") => {
    const value = draft?.[field];

    return value !== undefined && value !== null ? value : fallback;
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!valueOf("name").trim()) {
      setErrors({ name: "Hotel name is required." });
      return;
    }

    const checkIn = valueOf("checkInTime", "14:00");
    const checkOut = valueOf("checkOutTime", "12:00");

    if (checkOut && checkIn && checkOut <= checkIn) {
      setErrors({
        checkOutTime: "Check-out must be after check-in time.",
      });
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      // Send only the fields the user actually changed
      const payload = {};

      for (const field of [
        "name",
        "phone",
        "address",
        "city",
        "checkInTime",
        "checkOutTime",
        "wifiNetworkName",
        "wifiPassword",
      ]) {
        if (draft[field] !== original[field]) {
          payload[field] =
            typeof draft[field] === "string"
              ? draft[field].trim() || undefined
              : draft[field];
        }
      }

      const updated = await updateMyHotel(payload);

      setHotel(updated);
      setDraft(updated || {});
      setOriginal(updated || {});
      setToast("Hotel details saved and under review.");
    } catch (error) {
      console.error("Save hotel error:", error);
      setToast(error.message || "Failed to save hotel details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* TOPBAR */}
      <Header
        pageTitle="Hotel Info"
        pageDescription="Your property's details and channel configuration."
      />

      <main className="max-w-3xl px-6 py-8 lg:px-10">
        {toast && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {toast}

            <button
              type="button"
              className="ml-4 font-semibold"
              onClick={() => setToast("")}
            >
              OK
            </button>
          </div>
        )}

        {loadError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="text-brand-900/60 rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm shadow-xs">
            Loading hotel details...
          </div>
        ) : hotel ? (
          <div className="space-y-6">
            {/* CHANNEL SUMMARY */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
              <div className="border-b border-gray-100 px-6 py-5">
                <h2 className="font-display text-brand-900 text-lg font-semibold">
                  Channel Manager
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Your property's channel connection.
                </p>
              </div>

              <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                    Hotel code
                  </p>
                  <p className="text-brand-900 mt-1 font-mono text-sm">
                    {hotel.hotelCode || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                    Property code
                  </p>
                  <p className="text-brand-900 mt-1 font-mono text-sm">
                    {hotel.aiosellHotelCode || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                    Email (reviewed by super admin)
                  </p>
                  <p className="text-brand-900 mt-1 text-sm">
                    {hotel.email || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                    Subscription
                  </p>
                  <p className="text-brand-900 mt-1 text-sm">
                    {sliceDate(hotel.subscriptionStartDate)} —{" "}
                    {sliceDate(hotel.subscriptionEndDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* EDITABLE DETAILS */}
            <form
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs"
            >
              <div className="border-b border-gray-100 px-6 py-5">
                <h2 className="font-display text-brand-900 text-lg font-semibold">
                  Property details
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Edit the information shown to staff and guests.
                </p>
              </div>

              <div className="px-6 py-5">
                <Input
                  name="name"
                  label="Hotel name"
                  value={valueOf("name")}
                  onChange={(e) => setField("name", e.target.value)}
                  error={errors.name}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    name="phone"
                    label="Phone number"
                    type="tel"
                    value={valueOf("phone")}
                    onChange={(e) => setField("phone", e.target.value)}
                  />

                  <Input
                    name="city"
                    label="City"
                    value={valueOf("city")}
                    onChange={(e) => setField("city", e.target.value)}
                  />
                </div>

                <Input
                  name="address"
                  label="Address"
                  value={valueOf("address")}
                  onChange={(e) => setField("address", e.target.value)}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    name="checkInTime"
                    label="Check-in time"
                    type="time"
                    value={valueOf("checkInTime")}
                    onChange={(e) => setField("checkInTime", e.target.value)}
                  />

                  <Input
                    name="checkOutTime"
                    label="Check-out time"
                    type="time"
                    value={valueOf("checkOutTime")}
                    onChange={(e) => setField("checkOutTime", e.target.value)}
                    error={errors.checkOutTime}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    name="wifiNetworkName"
                    label="WiFi network name"
                    value={valueOf("wifiNetworkName")}
                    onChange={(e) =>
                      setField("wifiNetworkName", e.target.value)
                    }
                  />

                  <Input
                    name="wifiPassword"
                    label="WiFi password"
                    value={valueOf("wifiPassword")}
                    onChange={(e) => setField("wifiPassword", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 px-6 py-4">
                <Button type="submit" loading={saving}>
                  Save changes
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </main>
    </div>
  );
}
