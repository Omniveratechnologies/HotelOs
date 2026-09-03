import { createContext } from "react";
import type { GuestDashboardValue } from "./GuestDashboardContext";

export const GuestDashboardContext = createContext<GuestDashboardValue | null>(
  null,
);
