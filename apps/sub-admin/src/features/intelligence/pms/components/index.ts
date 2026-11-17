import { RevenueDashboard } from "./RevenueDashboard";
import { OccupancyDashboard } from "./OccupancyDashboard";
import { AdrDashboard } from "./AdrDashboard";
import { RevparDashboard } from "./RevparDashboard";
import { BookingsDashboard } from "./BookingsDashboard";
import { GuestsDashboard } from "./GuestsDashboard";
import { CancellationsDashboard } from "./CancellationsDashboard";
import { ForecastDashboard } from "./ForecastDashboard";

import type { DashboardData } from "../../shared/types";

export {
  RevenueDashboard,
  OccupancyDashboard,
  AdrDashboard,
  RevparDashboard,
  BookingsDashboard,
  GuestsDashboard,
  CancellationsDashboard,
  ForecastDashboard,
};

export const DASHBOARD_COMPONENTS: Record<
  string,
  React.ComponentType<{ data: DashboardData }>
> = {
  revenue: RevenueDashboard,
  occupancy: OccupancyDashboard,
  adr: AdrDashboard,
  revpar: RevparDashboard,
  bookings: BookingsDashboard,
  guests: GuestsDashboard,
  cancellations: CancellationsDashboard,
  forecast: ForecastDashboard,
};
