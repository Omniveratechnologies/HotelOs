import React, { useEffect, useMemo, useState } from "react";
import { getStoredUser } from "../../services/auth.service.js";
import { getMyHotel, updateMyHotel, getHotelStaff } from "../../services/settings.service.js";

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
            <p className="text-[10px] text-gray-400 mb-4">
              Hotel details are managed by the Sub-Admin. You have read-only access.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Hotel Name
              </label>
              <input value={hotel?.name || ""} disabled className={disabledInputClass} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Email
              </label>
              <input value={hotel?.email || ""} disabled className={disabledInputClass} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
            >
              <div>
                <div className="font-medium text-[#0f1f3d] text-sm capitalize">
                  {k.replace(/([A-Z])/g, " $1").trim()}
                </div>
                <div className="text-gray-400 text-xs">Receive alerts for this event</div>
              </div>
              <button
                onClick={() => setNotifs((p) => ({ ...p, [k]: !v }))}
                className={`w-12 h-6 rounded-full transition-all duration-200 relative ${v ? "bg-[#0f1f3d]" : "bg-gray-200"}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all duration-200 ${v ? "left-6" : "left-0.5"}`}
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
            <div className="space-y-3 mb-4">
              {staff.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-3 border-b border-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0f1f3d] flex items-center justify-center text-white font-bold text-sm">
                      {s.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-[#0f1f3d] text-sm">{s.name}</div>
                      <div className="text-gray-400 text-xs">
                        {roleLabel[s.role] || s.role} · {s.email}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}
                  >
                    {s.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-gray-400">No staff accounts yet.</div>
          )}
          <p className="text-[10px] text-gray-400 mb-2">
            Invite or manage staff from the Sub-Admin portal.
          </p>
          <button className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors">
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
              className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
            >
              <span className="font-semibold text-[#0f1f3d]">{type}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">₹</span>
                <input
                  defaultValue={rate}
                  className="w-24 text-right px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-[#0f1f3d] focus:outline-none focus:border-[#c9a84c]"
                />
                <span className="text-gray-400 text-sm">/night</span>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-gray-400">
            Rates are set per room in Room Management; this panel is informational for now.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1f3d] font-display">Settings</h1>
          <p className="text-gray-500 text-sm">Configure your HotelOS</p>
        </div>
        <button
          onClick={save}
          disabled={!hotel || saving || !canEditHotel}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${saved ? "bg-green-600 text-white" : "bg-[#0f1f3d] text-white hover:bg-[#162847]"}`}
        >
          {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
        </button>
      </div>

      {loading && (
        <div className="py-16 text-center text-gray-400 text-sm">Loading settings...</div>
      )}
      {!loading && loadError && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 mb-4">
          {loadError}
        </div>
      )}
      {!loading && !loadError && (
        <div className="space-y-5">
          {sections.map((s) => (
            <div
              key={s.title}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <h3 className="font-bold text-[#0f1f3d] flex items-center gap-2 mb-4">
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
