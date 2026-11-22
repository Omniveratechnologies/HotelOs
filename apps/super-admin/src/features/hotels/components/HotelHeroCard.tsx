import React from "react";
import Badge from "../../../components/ui/Badge.jsx";
import type { Hotel } from "../types.ts";

export interface HotelHeroCardProps {
  hotel: Hotel;
}

export const HotelHeroCard: React.FC<HotelHeroCardProps> = ({ hotel }) => {
  const fullAddress = [hotel.address, hotel.city, hotel.state, hotel.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="border-surface-200 mb-8 overflow-hidden rounded-2xl border bg-white p-6 shadow-xs">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary-100 text-primary-800 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold">
            {hotel.name?.charAt(0)?.toUpperCase() || "H"}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-brand-900 text-2xl font-bold">
                {hotel.name}
              </h1>
              <Badge
                status={hotel.status === "ACTIVE" ? "active" : "deactivated"}
              />
              {hotel.hotelCode && (
                <span className="bg-surface-100 text-brand-700 rounded-md px-2 py-0.5 font-mono text-xs font-semibold">
                  {hotel.hotelCode}
                </span>
              )}
            </div>
            {fullAddress && (
              <p className="text-brand-600 mt-1 text-sm">{fullAddress}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="border-surface-200 bg-surface-50 rounded-xl border px-4 py-2 text-right">
            <span className="text-brand-500 block text-xs">
              Aiosell PMS Code
            </span>
            <span className="text-brand-900 font-mono text-sm font-semibold">
              {hotel.aiosellHotelCode || "Not Configured"}
            </span>
          </div>
          <div className="border-surface-200 bg-surface-50 rounded-xl border px-4 py-2 text-right">
            <span className="text-brand-500 block text-xs">Tax Rate (GST)</span>
            <span className="text-brand-900 text-sm font-semibold">
              {hotel.taxPercent != null ? `${hotel.taxPercent}%` : "Default"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelHeroCard;
