import { BedDouble, ConciergeBell, Phone, Sparkles, UtensilsCrossed } from "lucide-react";
import type { ServiceKind } from "@/types/guest-dashboard";

export const SERVICE_ICON: Record<ServiceKind, typeof UtensilsCrossed> = {
  food: UtensilsCrossed,
  amenities: Sparkles,
  restaurant: ConciergeBell,
  reception: Phone,
  housekeeping: BedDouble,
};
