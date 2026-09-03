import { useContext } from "react";
import { GuestDashboardContext } from "./guest-dashboard-context";

export function useGuestDashboard() {
  const context = useContext(GuestDashboardContext);
  if (!context) {
    throw new Error(
      "useGuestDashboard must be used inside a GuestDashboardProvider",
    );
  }
  return context;
}
