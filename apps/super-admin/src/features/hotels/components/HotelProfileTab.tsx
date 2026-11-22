import React from "react";
import { Pencil } from "lucide-react";
import type { Hotel, HotelEditSection } from "../types.ts";

export interface HotelProfileTabProps {
  hotel: Hotel;
  onEditSection: (section: HotelEditSection) => void;
}

function formatDate(date?: string | null): string {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
}

export const HotelProfileTab: React.FC<HotelProfileTabProps> = ({
  hotel,
  onEditSection,
}) => {
  const cityStatePincode = [hotel.city, hotel.state, hotel.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* BASIC IDENTITY */}
        <div className="border-surface-200 rounded-2xl border bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="font-display text-brand-900 font-semibold">
              Identity & System Codes
            </h3>
            <button
              type="button"
              onClick={() => onEditSection("identity")}
              className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 text-xs font-semibold"
            >
              <Pencil size={12} /> Edit
            </button>
          </div>
          <dl className="divide-surface-100 mt-4 divide-y text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">Hotel Name</dt>
              <dd className="text-brand-900 font-semibold">{hotel.name}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">Hotel Code</dt>
              <dd className="text-brand-900 font-mono font-semibold">
                {hotel.hotelCode || "—"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">Channel Manager Code</dt>
              <dd className="text-brand-900 font-mono font-semibold">
                {hotel.aiosellHotelCode || "—"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">Internal ID</dt>
              <dd className="text-brand-700 font-mono text-xs">{hotel._id}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">Onboarding Date</dt>
              <dd className="text-brand-800 font-mono">
                {formatDate(hotel.createdAt)}
              </dd>
            </div>
          </dl>
        </div>

        {/* LOCATION & CONTACT */}
        <div className="border-surface-200 rounded-2xl border bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="font-display text-brand-900 font-semibold">
              Location & Contact
            </h3>
            <button
              type="button"
              onClick={() => onEditSection("contact")}
              className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 text-xs font-semibold"
            >
              <Pencil size={12} /> Edit
            </button>
          </div>
          <dl className="divide-surface-100 mt-4 divide-y text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">Contact Email</dt>
              <dd className="text-brand-900 font-semibold">
                {hotel.email || "—"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">Phone</dt>
              <dd className="text-brand-800">{hotel.phone || "—"}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">Address</dt>
              <dd className="text-brand-800 text-right">
                {hotel.address || "—"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">City, State, Pincode</dt>
              <dd className="text-brand-800">{cityStatePincode || "—"}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">Country</dt>
              <dd className="text-brand-800">{hotel.country || "India"}</dd>
            </div>
          </dl>
        </div>

        {/* TAXES & BILLING */}
        <div className="border-surface-200 rounded-2xl border bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="font-display text-brand-900 font-semibold">
              Taxation & Currency
            </h3>
            <button
              type="button"
              onClick={() => onEditSection("tax")}
              className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 text-xs font-semibold"
            >
              <Pencil size={12} /> Edit
            </button>
          </div>
          <dl className="divide-surface-100 mt-4 divide-y text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">GSTIN</dt>
              <dd className="text-brand-900 font-mono font-semibold">
                {hotel.gstin || "—"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">Tax Percentage (GST %)</dt>
              <dd className="text-brand-900 font-semibold">
                {hotel.taxPercent != null ? `${hotel.taxPercent}%` : "Default"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">Billing Currency</dt>
              <dd className="text-brand-900 font-semibold">
                {hotel.currency || "INR"}
              </dd>
            </div>
          </dl>
        </div>

        {/* OPERATIONS & WI-FI */}
        <div className="border-surface-200 rounded-2xl border bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="font-display text-brand-900 font-semibold">
              Operations & Wi-Fi
            </h3>
            <button
              type="button"
              onClick={() => onEditSection("operations")}
              className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 text-xs font-semibold"
            >
              <Pencil size={12} /> Edit
            </button>
          </div>
          <dl className="divide-surface-100 mt-4 divide-y text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">Check-in Time</dt>
              <dd className="text-brand-900 font-semibold">
                {hotel.checkInTime || "12:00 PM"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">Check-out Time</dt>
              <dd className="text-brand-900 font-semibold">
                {hotel.checkOutTime || "11:00 AM"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">Wi-Fi SSID</dt>
              <dd className="text-brand-800 font-mono">
                {hotel.wifiNetworkName || "—"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-brand-500">Wi-Fi Password</dt>
              <dd className="text-brand-800 font-mono">
                {hotel.wifiPassword ? "••••••••" : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* POLICIES & TERMS */}
      <div className="border-surface-200 rounded-2xl border bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="font-display text-brand-900 font-semibold">
              Policies & House Terms
            </h3>
            <p className="text-brand-500 mt-0.5 text-xs">
              Cancellation rules and booking conditions presented to guests.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEditSection("policies")}
            className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 text-xs font-semibold"
          >
            <Pencil size={12} /> Edit
          </button>
        </div>
        <div className="mt-4 grid gap-6 text-sm md:grid-cols-2">
          <div>
            <h4 className="text-brand-500 mb-2 text-xs font-semibold tracking-wider uppercase">
              Cancellation Policy
            </h4>
            <p className="text-brand-800 leading-relaxed whitespace-pre-line">
              {hotel.cancellationPolicy ||
                "No specific cancellation policy specified."}
            </p>
          </div>
          <div>
            <h4 className="text-brand-500 mb-2 text-xs font-semibold tracking-wider uppercase">
              Terms & Conditions
            </h4>
            <p className="text-brand-800 leading-relaxed whitespace-pre-line">
              {hotel.termsAndConditions ||
                "Standard terms and conditions apply."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelProfileTab;
