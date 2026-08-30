import React, { useEffect, useMemo, useState } from "react";
import { getStoredUser } from "../../services/auth.service.js";
import {
  getMyHotel,
  updateMyHotel,
  getHotelStaff,
} from "../../services/settings.service.js";

const roleLabel = { RECEPTIONIST: "Receptionist", KITCHEN: "Kitchen" };

const inputClass =
  "w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]";
const disabledInputClass = inputClass + " bg-gray-50 text-gray-400";

export default function SettingsPage() {
  const user = useMemo(() => getStoredUser() || {}, []);
  const canEditHotel = user.role === "SUB_ADMIN";
  const [hotel, setHotel] = useState(null);
  const [form, setForm] = useState({
    phone: "",
    address: "",
    city: "",
    checkIn: "14:00",
    checkOut: "12:00",
  });
  const [notifs, setNotifs] = useState({
    newBooking: true,
    checkIn: true,
    checkOut: true,
    foodOrder: true,
    serviceRequest: true,
    lowOccupancy: false,
  });
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [h, s] = await Promise.all([getMyHotel(), getHotelStaff()]);
        if (cancelled) return;
        setHotel(h);
        setForm({
          phone: h?.phone || "",
          address: h?.address || "",
          city: h?.city || "",
          checkIn: h?.checkInTime || "14:00",
          checkOut: h?.checkOutTime || "12:00",
        });
        setStaff(s);
        setLoadError("");
      } catch (err) {
        console.error("Failed to load settings:", err);
        if (!cancelled) setLoadError(err.message || "Failed to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const save = async () => {
    if (!hotel || saving) return;
    setSaving(true);
    setSaved(false);
    setLoadError("");
    try {
      const updated = await updateMyHotel({
        phone: form.phone,
        address: form.address,
        city: form.city,
        checkInTime: form.checkIn,
        checkOutTime: form.checkOut,
      });
      setHotel(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setLoadError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    {
      title: "Hotel Information",
      icon: "🏨",
      content: (
        <div>
          {!canEditHotel && (
            <p className="mb-4 text-[10px] text-gray-400">
              Hotel details are managed by the Sub-Admin. You have read-only
              access.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Hotel Name
              </label>
              <input
                value={hotel?.name || ""}
                disabled
                className={disabledInputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Email
              </label>
              <input
                value={hotel?.email || ""}
                disabled
                className={disabledInputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={set("phone")}
                disabled={!canEditHotel}
                className={canEditHotel ? inputClass : disabledInputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                City
              </label>
              <input
                value={form.city}
                onChange={set("city")}
                disabled={!canEditHotel}
                className={canEditHotel ? inputClass : disabledInputClass}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Address
              </label>
              <input
                value={form.address}
                onChange={set("address")}
                disabled={!canEditHotel}
                className={canEditHotel ? inputClass : disabledInputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Check-in Time
              </label>
              <input
                type="time"
                value={form.checkIn}
                onChange={set("checkIn")}
                disabled={!canEditHotel}
                className={canEditHotel ? inputClass : disabledInputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Check-out Time
              </label>
              <input
                type="time"
                value={form.checkOut}
                onChange={set("checkOut")}
                disabled={!canEditHotel}
                className={canEditHotel ? inputClass : disabledInputClass}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Notifications",
      icon: "🔔",
      content: (
        <div className="space-y-3">
          {Object.entries(notifs).map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between border-b border-gray-50 py-2 last:border-0"
            >
              <div>
                <div className="text-sm font-medium capitalize text-[#0f1f3d]">
                  {k.replace(/([A-Z])/g, " $1").trim()}
                </div>
                <div className="text-xs text-gray-400">
                  Receive alerts for this event
                </div>
              </div>
              <button
                onClick={() => setNotifs((p) => ({ ...p, [k]: !v }))}
                className={`relative h-6 w-12 rounded-full transition-all duration-200 ${v ? "bg-[#0f1f3d]" : "bg-gray-200"}`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${v ? "left-6" : "left-0.5"}`}
                />
              </button>
            </div>
          ))}
          <p className="text-[10px] text-gray-400">
            Notification preferences are stored locally for now.
          </p>
        </div>
      ),
    },
    {
      title: "Staff Accounts",
      icon: "👥",
      content: (
        <div>
          {staff.length > 0 ? (
            <div className="mb-4 space-y-3">
              {staff.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between border-b border-gray-50 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f1f3d] text-sm font-bold text-white">
                      {s.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#0f1f3d]">
                        {s.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {roleLabel[s.role] || s.role} · {s.email}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${s.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}
                  >
                    {s.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-gray-400">
              No staff accounts yet.
            </div>
          )}
          <p className="mb-2 text-[10px] text-gray-400">
            Invite or manage staff from the Sub-Admin portal.
          </p>
          <button className="w-full rounded-xl border-2 border-dashed border-gray-300 py-2.5 text-sm text-gray-500 transition-colors hover:border-[#c9a84c] hover:text-[#c9a84c]">
            + Add Staff Member
          </button>
        </div>
      ),
    },
    {
      title: "Room Rates",
      icon: "💰",
      content: (
        <div className="space-y-3">
          {[
            ["Standard", "2500"],
            ["Deluxe", "3500"],
            ["Suite", "6000"],
          ].map(([type, rate]) => (
            <div
              key={type}
              className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
            >
              <span className="font-semibold text-[#0f1f3d]">{type}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">₹</span>
                <input
                  defaultValue={rate}
                  className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-right text-sm font-bold text-[#0f1f3d] focus:border-[#c9a84c] focus:outline-none"
                />
                <span className="text-sm text-gray-400">/night</span>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-gray-400">
            Rates are set per room in Room Management; this panel is
            informational for now.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0f1f3d]">
            Settings
          </h1>
          <p className="text-sm text-gray-500">Configure your HotelOS</p>
        </div>
        <button
          onClick={save}
          disabled={!hotel || saving || !canEditHotel}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${saved ? "bg-green-600 text-white" : "bg-[#0f1f3d] text-white hover:bg-[#162847]"}`}
        >
          {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
        </button>
      </div>

      {loading && (
        <div className="py-16 text-center text-sm text-gray-400">
          Loading settings...
        </div>
      )}
      {!loading && loadError && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {loadError}
        </div>
      )}
      {!loading && !loadError && (
        <div className="space-y-5">
          {sections.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <h3 className="mb-4 flex items-center gap-2 font-bold text-[#0f1f3d]">
                <span>{s.icon}</span> {s.title}
              </h3>
              {s.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
