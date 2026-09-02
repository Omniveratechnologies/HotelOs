import {
  BedDouble,
  ConciergeBell,
  Phone,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

export const SERVICE_ICON = {
  food: UtensilsCrossed,
  amenities: Sparkles,
  AMENITY: Sparkles,
  RESTAURANT: ConciergeBell,
  RECEPTION: Phone,
  HOUSEKEEPING: BedDouble,
  MAINTENANCE: Phone,
} as const;
