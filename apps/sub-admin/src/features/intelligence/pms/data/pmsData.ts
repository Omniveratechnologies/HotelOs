export interface MetricDefinition {
  label: string;
  icon: string;
}

export interface DashboardMeta {
  title: string;
  icon: string;
  subtitle: string;
  metrics: MetricDefinition[];
}

export const DASHBOARD_IDS = [
  "revenue",
  "occupancy",
  "adr",
  "revpar",
  "bookings",
  "guests",
  "cancellations",
  "forecast",
] as const;

export type PmsDashboardId = (typeof DASHBOARD_IDS)[number];

export const DASHBOARDS: Record<PmsDashboardId, DashboardMeta> = {
  revenue: {
    title: "Revenue",
    icon: "BarChart3",
    subtitle:
      "Track, analyze and grow your hotel revenue with AI-powered insights.",
    metrics: [
      { label: "Total Revenue", icon: "IndianRupee" },
      { label: "Room Revenue", icon: "BedDouble" },
      { label: "Services Revenue", icon: "ConciergeBell" },
      { label: "Average Daily Revenue", icon: "Activity" },
      { label: "Revenue Growth", icon: "TrendingUp" },
    ],
  },
  occupancy: {
    title: "Occupancy",
    icon: "BedDouble",
    subtitle:
      "Track, analyze and optimize your hotel occupancy with AI-powered insights.",
    metrics: [
      { label: "Current Occupancy", icon: "BedDouble" },
      { label: "Total Rooms", icon: "Home" },
      { label: "Occupied Rooms", icon: "Users" },
      { label: "Available Rooms", icon: "DoorOpen" },
      { label: "Average Occupancy (MTD)", icon: "Activity" },
      { label: "Highest Occupancy Day", icon: "CalendarCheck" },
      { label: "Lowest Occupancy Day", icon: "CalendarX" },
      { label: "Room Nights Sold", icon: "Moon" },
    ],
  },
  adr: {
    title: "ADR",
    icon: "Gauge",
    subtitle:
      "Track your Average Daily Rate, analyze trends and get AI-powered insights.",
    metrics: [
      { label: "Average Daily Rate", icon: "IndianRupee" },
      { label: "Room Revenue", icon: "BedDouble" },
      { label: "RevPAR", icon: "LineChart" },
      { label: "ADR (Weekdays)", icon: "CalendarDays" },
      { label: "ADR (Weekends)", icon: "Star" },
    ],
  },
  revpar: {
    title: "RevPAR",
    icon: "LineChart",
    subtitle:
      "Track Revenue Per Available Room, benchmark performance and optimize yield.",
    metrics: [
      { label: "RevPAR", icon: "LineChart" },
      { label: "Average Daily Rate", icon: "IndianRupee" },
      { label: "Occupancy Rate", icon: "Percent" },
      { label: "RevPAR (Weekdays)", icon: "CalendarDays" },
      { label: "RevPAR (Weekends)", icon: "Star" },
    ],
  },
  bookings: {
    title: "Bookings",
    icon: "CalendarCheck",
    subtitle:
      "Monitor reservation volumes, booking channels, lead times and pickup pacing.",
    metrics: [
      { label: "Total Bookings", icon: "BookMarked" },
      { label: "Direct Bookings", icon: "BedSingle" },
      { label: "OTA Bookings", icon: "LayoutDashboard" },
      { label: "Avg. Booking Lead Time", icon: "Clock" },
      { label: "Avg. Length of Stay", icon: "Moon" },
    ],
  },
  guests: {
    title: "Guests",
    icon: "Users",
    subtitle:
      "Understand guest demographics, repeat rates, satisfaction and lifetime value.",
    metrics: [
      { label: "Total Guests", icon: "Users" },
      { label: "Repeat Guests", icon: "Repeat" },
      { label: "Repeat Guest Rate", icon: "Percent" },
      { label: "New Guests", icon: "UserPlus" },
      { label: "Avg. Spend Per Guest", icon: "IndianRupee" },
    ],
  },
  cancellations: {
    title: "Cancellations",
    icon: "CalendarX",
    subtitle:
      "Track cancellation trends, analyze reasons and minimize revenue loss with AI-powered insights.",
    metrics: [
      { label: "Total Cancellations", icon: "XCircle" },
      { label: "Cancellation Rate", icon: "Percent" },
      { label: "Revenue Lost", icon: "IndianRupee" },
      { label: "Cancelled Room Nights", icon: "Moon" },
      { label: "Avg. Days Before Cancel", icon: "Clock" },
    ],
  },
  forecast: {
    title: "Forecast",
    icon: "Sparkles",
    subtitle:
      "AI-powered forecast for occupancy, revenue, ADR and demand to help you plan better.",
    metrics: [
      { label: "Forecasted Occupancy", icon: "BedDouble" },
      { label: "Forecasted Revenue", icon: "IndianRupee" },
      { label: "Forecasted ADR", icon: "Gauge" },
      { label: "Forecasted RevPAR", icon: "LineChart" },
      { label: "Expected Bookings", icon: "CalendarRange" },
    ],
  },
};
