import React from "react";
import { Globe, CheckCircle2 } from "lucide-react";

export function WebsiteRegistrationBanner() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        <span>
          <strong className="font-semibold">Website Booking:</strong> This guest
          registered and booked directly through your website booking engine.
        </span>
      </div>
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        <Globe className="h-3 w-3" />
        Direct Web
      </span>
    </div>
  );
}

export function WebsiteGuestCard({ guest }) {
  if (!guest?.name) return null;
  return (
    <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-bold tracking-wider text-emerald-800 uppercase">
          Website Guest Profile
        </h4>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
          Verified Web
        </span>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="font-semibold text-gray-900">{guest.name}</div>
        <div className="text-gray-600">{guest.phone}</div>
        {guest.email && <div className="text-gray-500">{guest.email}</div>}
        {guest.idNumber && (
          <div className="border-t border-gray-100 pt-1 text-gray-500">
            {guest.idType}: {guest.idNumber}
          </div>
        )}
      </div>
    </div>
  );
}
