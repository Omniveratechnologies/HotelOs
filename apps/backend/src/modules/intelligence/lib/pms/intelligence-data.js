// Dashboard registry: id, display copy, and the KPI-card order for each of the 8 PMS Intelligence pages.
// Metric `label`s must match the keys produced in dashboard-shape.js's `selectedMetrics`/`changes` maps.
export const DASHBOARD_IDS = [
  "revenue",
  "occupancy",
  "adr",
  "revpar",
  "bookings",
  "guests",
  "cancellations",
  "forecast",
];

export const DASHBOARDS = {
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
      "Track your Revenue per Available Room, analyze performance and get AI-powered insights.",
    metrics: [
      { label: "RevPAR", icon: "LineChart" },
      { label: "ADR", icon: "IndianRupee" },
      { label: "Occupancy Rate", icon: "BedDouble" },
      { label: "Total Revenue", icon: "IndianRupee" },
      { label: "Available Rooms", icon: "DoorOpen" },
    ],
  },
  bookings: {
    title: "Booking Trends",
    icon: "CalendarRange",
    subtitle:
      "Analyze your booking patterns, sources, lead time and forecasts with AI-powered insights.",
    metrics: [
      { label: "Total Bookings", icon: "CalendarRange" },
      { label: "Confirmed", icon: "CheckCircle2" },
      { label: "Pending", icon: "Clock" },
      { label: "Cancelled", icon: "XCircle" },
      { label: "No-shows", icon: "UserX" },
    ],
  },
  guests: {
    title: "Guest Insights",
    icon: "Users",
    subtitle:
      "Understand your guests, their behavior, preferences and value with AI-powered insights.",
    metrics: [
      { label: "Total Guests", icon: "Users" },
      { label: "New Guests", icon: "UserPlus" },
      { label: "Returning Guests", icon: "Repeat" },
      { label: "Average Guest Spend", icon: "IndianRupee" },
      { label: "Average Length of Stay", icon: "Moon" },
    ],
  },
  cancellations: {
    title: "Cancellation",
    icon: "XCircle",
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

export function assertKnownDashboard(id) {
  if (!DASHBOARD_IDS.includes(id)) {
    const e = new Error(`Unknown dashboard "${id}".`);
    e.status = 404;
    throw e;
  }
}

// Re-exported here (rather than imported directly from demo-data.js) so callers have one
// stable "the dashboard registry + how to fetch demo data" entry point.
