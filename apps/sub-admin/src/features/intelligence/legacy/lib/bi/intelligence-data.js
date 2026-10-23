export const BI_DASHBOARD_IDS = [
  "total-revenue",
  "pms-pos-revenue",
  "profitability",
  "conversion",
  "guest-spending",
  "revenue-forecast",
  "clv",
  "recommendations",
];

export const BI_DASHBOARDS = {
  "total-revenue": {
    title: "Total Revenue",
    icon: "Layers",
    subtitle:
      "Complete revenue overview from PMS (Rooms) and POS (F&B) with trends, comparisons and insights.",
    metrics: [
      { label: "Total Revenue", icon: "IndianRupee" },
      { label: "PMS Revenue (Rooms)", icon: "BedDouble" },
      { label: "POS Revenue (F&B)", icon: "ConciergeBell" },
      { label: "Other Revenue", icon: "Boxes" },
      { label: "Total Transactions", icon: "ClipboardList" },
    ],
  },
  "pms-pos-revenue": {
    title: "PMS + POS Revenue",
    icon: "PieChart",
    subtitle:
      "Combined revenue from Rooms (PMS) and Food & Beverage (POS) with detailed insights and comparisons.",
    metrics: [
      { label: "Total PMS + POS Revenue", icon: "Layers" },
      { label: "PMS Revenue (Rooms)", icon: "BedDouble" },
      { label: "POS Revenue (F&B)", icon: "ConciergeBell" },
      { label: "PMS Contribution", icon: "Percent" },
      { label: "POS Contribution", icon: "Percent" },
    ],
  },
  profitability: {
    title: "Property Profitability",
    icon: "Wallet",
    subtitle:
      "Track profitability across rooms, restaurants and other outlets with cost analysis and margins.",
    metrics: [
      { label: "Total Revenue", icon: "Layers" },
      { label: "Total Cost", icon: "Receipt" },
      { label: "Gross Profit", icon: "TrendingUp" },
      { label: "Profit Margin", icon: "Percent" },
      { label: "Net Profit", icon: "LineChart" },
    ],
  },
  conversion: {
    title: "Guest → Restaurant Conversion",
    icon: "ConciergeBell",
    subtitle:
      "Track how many hotel guests dine at your restaurants, what they spend, and how to increase conversion.",
    metrics: [
      { label: "Total In-House Guests", icon: "Users" },
      { label: "Guests Who Dined", icon: "ConciergeBell" },
      { label: "Guest → Restaurant Conversion Rate", icon: "Percent" },
      { label: "Avg Spend per Dining Guest", icon: "IndianRupee" },
      {
        label: "Total Restaurant Revenue (from In-House Guests)",
        icon: "Gift",
      },
    ],
  },
  "guest-spending": {
    title: "Hotel Guest Spending",
    icon: "Wallet",
    subtitle:
      "Analyze how hotel guests spend across rooms, restaurants, bar, spa and other services.",
    metrics: [
      { label: "Total Hotel Guests", icon: "Users" },
      { label: "Avg Guest Spend (per guest)", icon: "IndianRupee" },
      { label: "Total Guest Spending", icon: "Boxes" },
      { label: "POS Spend per Guest (F&B + Other)", icon: "ConciergeBell" },
      { label: "Room Revenue per Guest", icon: "BedDouble" },
    ],
  },
  "revenue-forecast": {
    title: "Revenue Forecast",
    icon: "LineChart",
    subtitle:
      "Predict future revenue for PMS (Rooms) and POS (F&B) using historical data, bookings, seasonality and AI insights.",
    metrics: [
      { label: "Forecasted Total Revenue", icon: "TrendingUp" },
      { label: "Forecasted Room Revenue (PMS)", icon: "BedDouble" },
      { label: "Forecasted F&B Revenue (POS)", icon: "ConciergeBell" },
      { label: "Expected Occupancy", icon: "Users" },
      { label: "Expected Covers (Restaurant)", icon: "Utensils" },
    ],
  },
  clv: {
    title: "Customer Lifetime Value (CLV)",
    icon: "Gem",
    subtitle:
      "Understand the long-term value of your hotel guests and identify opportunities to increase loyalty and repeat spending.",
    metrics: [
      { label: "Total Guests (Unique)", icon: "Users" },
      { label: "Average Customer Lifetime Value", icon: "IndianRupee" },
      { label: "Repeat Guest Rate", icon: "Repeat" },
      { label: "Revenue from Repeat Guests", icon: "Boxes" },
      { label: "Avg Length of Relationship", icon: "CalendarDays" },
    ],
  },
  recommendations: {
    title: "AI Recommendations",
    icon: "Sparkles",
    subtitle:
      "Get data-driven recommendations to increase revenue, improve operations and enhance guest experience.",
    metrics: [
      { label: "Potential Revenue Uplift", icon: "TrendingUp" },
      { label: "Top Opportunity", icon: "Target" },
      { label: "Guest Experience Score", icon: "Star" },
      { label: "Operational Efficiency", icon: "Zap" },
      { label: "AI Suggestions", icon: "Sparkles" },
    ],
  },
};

export function assertKnownBiDashboard(id) {
  if (!BI_DASHBOARD_IDS.includes(id)) {
    const e = new Error(`Unknown Business Intelligence dashboard "${id}".`);
    e.status = 404;
    throw e;
  }
}
