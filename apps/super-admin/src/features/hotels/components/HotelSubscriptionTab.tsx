import React from "react";
import { CheckCircle2, Pencil } from "lucide-react";
import { Button } from "@hotelos/ui/components";
import type { Hotel, HotelEditSection } from "../types.ts";

export interface HotelSubscriptionTabProps {
  hotel: Hotel;
  onEditSection: (section: HotelEditSection) => void;
}

function formatDate(date?: string | null): string {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
}

export const HotelSubscriptionTab: React.FC<HotelSubscriptionTabProps> = ({
  hotel,
  onEditSection,
}) => {
  return (
    <div className="border-surface-200 rounded-2xl border bg-white p-6 shadow-xs">
      <h3 className="font-display text-brand-900 mb-2 text-lg font-semibold">
        Subscription & License
      </h3>
      <p className="text-brand-500 mb-6 text-sm">
        Platform license dates and subscription plan assigned to this property.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="border-surface-200 bg-surface-50 rounded-xl border p-4">
          <span className="text-brand-500 block text-xs font-semibold uppercase">
            License Status
          </span>
          <div className="mt-2 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span className="font-display text-brand-900 text-lg font-bold">
              {hotel.status === "ACTIVE" ? "Active License" : "Suspended"}
            </span>
          </div>
        </div>

        <div className="border-surface-200 bg-surface-50 rounded-xl border p-4">
          <span className="text-brand-500 block text-xs font-semibold uppercase">
            Subscription Start
          </span>
          <span className="font-display text-brand-900 mt-2 block text-lg font-bold">
            {formatDate(hotel.subscriptionStartDate)}
          </span>
        </div>

        <div className="border-surface-200 bg-surface-50 rounded-xl border p-4">
          <span className="text-brand-500 block text-xs font-semibold uppercase">
            Subscription Expiry
          </span>
          <span className="font-display text-brand-900 mt-2 block text-lg font-bold">
            {formatDate(hotel.subscriptionEndDate)}
          </span>
        </div>
      </div>

      <div className="mt-6 flex justify-end border-t pt-4">
        <Button icon={Pencil} onClick={() => onEditSection("subscription")}>
          Modify Subscription Dates
        </Button>
      </div>
    </div>
  );
};

export default HotelSubscriptionTab;
