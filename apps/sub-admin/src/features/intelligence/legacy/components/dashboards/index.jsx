"use client";
import RevenueDashboard from "./RevenueDashboard";
import OccupancyDashboard from "./OccupancyDashboard";
import AdrDashboard from "./AdrDashboard";
import RevparDashboard from "./RevparDashboard";
import BookingsDashboard from "./BookingsDashboard";
import GuestsDashboard from "./GuestsDashboard";
import CancellationsDashboard from "./CancellationsDashboard";
import ForecastDashboard from "./ForecastDashboard";

export const DASHBOARD_COMPONENTS = {
  revenue: RevenueDashboard,
  occupancy: OccupancyDashboard,
  adr: AdrDashboard,
  revpar: RevparDashboard,
  bookings: BookingsDashboard,
  guests: GuestsDashboard,
  cancellations: CancellationsDashboard,
  forecast: ForecastDashboard,
};
