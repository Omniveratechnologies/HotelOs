// Shared, format-agnostic report definition: both the Excel builder (toWorkbook.js) and the
// PDF builder (toPdf.js) read the SAME sections for a given dashboard, so the two exports never
// drift apart. Column `type` drives number formatting in each output ('text' | 'number' | 'money' | 'percent').

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const col = (key, header, type = "text") => ({ key, header, type });

function seriesTable(title, columns) {
  return (data) => ({
    title,
    columns: [col("day", "Date"), ...columns],
    rows: data.series.map((r) => [r.day, ...columns.map((c) => r[c.key])]),
  });
}

function simpleTable(title, key, columns) {
  return (data) => ({
    title,
    columns,
    rows: (data[key] || []).map((r) => columns.map((c) => r[c.key])),
  });
}

function heatmapTable(title, key) {
  return (data) => ({
    title,
    columns: [
      col("name", "Room Type"),
      ...DAYS.map((d) => col(d, d, "number")),
    ],
    rows: (data[key] || []).map((r) => [r.name, ...r.values]),
  });
}

const money = (k, h) => col(k, h, "money");
const pct = (k, h) => col(k, h, "percent");
const numc = (k, h) => col(k, h, "number");
const moneyStr = (v) =>
  v == null ? "—" : `₹${Math.round(v).toLocaleString("en-IN")}`;
const range2 = (lo, hi) =>
  lo == null || hi == null ? "—" : `${moneyStr(lo)} – ${moneyStr(hi)}`;

const BUILDERS = {
  revenue: [
    seriesTable("Daily Revenue", [
      money("total", "Total Revenue"),
      money("room", "Room Revenue"),
      money("services", "Services Revenue"),
      money("foodBeverage", "F&B Revenue"),
      money("miscellaneous", "Misc. Revenue"),
    ]),
    simpleTable("Revenue Breakdown", "revenueBreakdown", [
      col("name", "Category"),
      money("value", "Amount"),
    ]),
    simpleTable("Revenue by Room Type", "roomTypes", [
      col("name", "Room Type"),
      money("revenue", "Revenue"),
      money("adr", "ADR"),
      pct("occupancy", "Occupancy"),
      numc("bookings", "Bookings"),
    ]),
    simpleTable("Revenue by Booking Source", "sources", [
      col("name", "Source"),
      money("revenue", "Revenue"),
      numc("count", "Bookings"),
    ]),
    simpleTable("Revenue by Payment Method", "paymentMethods", [
      col("name", "Method"),
      money("revenue", "Revenue"),
      numc("count", "Count"),
    ]),
  ],
  occupancy: [
    seriesTable("Daily Occupancy", [
      pct("occupancyPct", "Occupancy %"),
      numc("roomNights", "Room Nights Sold"),
    ]),
    simpleTable("Occupancy by Room Type", "roomTypes", [
      col("name", "Room Type"),
      pct("occupancy", "Occupancy"),
      numc("bookings", "Bookings"),
    ]),
    simpleTable("Occupancy by Booking Source", "sources", [
      col("name", "Source"),
      numc("count", "Occupied Room Nights"),
    ]),
    heatmapTable("Occupancy Heatmap (%) by Room Type × Weekday", "heatmap"),
  ],
  adr: [
    seriesTable("Daily ADR", [money("adr", "ADR")]),
    simpleTable("ADR by Room Type", "roomTypes", [
      col("name", "Room Type"),
      money("adr", "ADR"),
      money("revenue", "Revenue"),
    ]),
    simpleTable("ADR by Booking Source", "sources", [
      col("name", "Source"),
      money("adr", "ADR"),
    ]),
    simpleTable("ADR by Day of Week", "weekdays", [
      col("name", "Day"),
      money("adr", "ADR"),
    ]),
    simpleTable("ADR Comparison", "comparison", [
      col("name", "Period"),
      col("value", "Value"),
      col("change", "Change"),
    ]),
    heatmapTable("ADR Heatmap (₹) by Room Type × Weekday", "rateHeatmap"),
  ],
  revpar: [
    seriesTable("Daily RevPAR / ADR / Occupancy", [
      money("revpar", "RevPAR"),
      money("adr", "ADR"),
      pct("occupancyPct", "Occupancy %"),
    ]),
    simpleTable("RevPAR by Room Type", "roomTypes", [
      col("name", "Room Type"),
      money("revpar", "RevPAR"),
    ]),
    simpleTable("RevPAR by Booking Source", "sources", [
      col("name", "Source"),
      money("revpar", "RevPAR"),
    ]),
    simpleTable("RevPAR by Day of Week", "weekdays", [
      col("name", "Day"),
      money("revpar", "RevPAR"),
    ]),
    simpleTable("RevPAR Comparison", "comparison", [
      col("name", "Period"),
      col("value", "Value"),
      col("change", "Change"),
    ]),
  ],
  bookings: [
    seriesTable("Daily Bookings", [
      numc("bookings", "Total"),
      numc("confirmed", "Confirmed"),
      numc("pending", "Pending"),
      numc("cancelled", "Cancelled"),
      numc("noShows", "No-shows"),
    ]),
    simpleTable("Bookings by Room Type", "roomTypes", [
      col("name", "Room Type"),
      numc("bookings", "Bookings"),
    ]),
    simpleTable("Bookings by Source", "sources", [
      col("name", "Source"),
      numc("count", "Bookings"),
      pct("value", "Share %"),
    ]),
    simpleTable("Booking Lead Time", "leadTime", [
      col("name", "Lead Time"),
      numc("count", "Bookings"),
      pct("value", "Share %"),
    ]),
    simpleTable("Stay Duration", "stayDuration", [
      col("name", "Duration"),
      numc("count", "Bookings"),
      pct("value", "Share %"),
    ]),
  ],
  guests: [
    seriesTable("Daily Guest Arrivals", [numc("guests", "Guests")]),
    simpleTable("Guest Type Distribution", "guestMix", [
      col("name", "Type"),
      numc("count", "Guests"),
      pct("value", "Share %"),
    ]),
    simpleTable("Guest Nationality (Top 5)", "nationality", [
      col("name", "Nationality"),
      numc("count", "Guests"),
      pct("value", "Share %"),
    ]),
    simpleTable("Top Guest Cities", "cities", [
      col("name", "City"),
      numc("count", "Guests"),
      pct("value", "Share %"),
    ]),
    simpleTable("Guests by Age Group", "ageGroups", [
      col("name", "Age Group"),
      numc("count", "Guests"),
      pct("value", "Share %"),
    ]),
    simpleTable("Purpose of Visit", "purpose", [
      col("name", "Purpose"),
      numc("count", "Guests"),
      pct("value", "Share %"),
    ]),
    simpleTable("Stay Duration", "stayDuration", [
      col("name", "Duration"),
      numc("count", "Bookings"),
      pct("value", "Share %"),
    ]),
    (data) => ({
      title: "Repeat Guest Analysis",
      columns: [col("metric", "Metric"), col("value", "Value")],
      rows: [
        ["Return rate", `${data.repeatAnalysis.returningRate.toFixed(1)}%`],
        [
          "Avg bookings / returning guest",
          data.repeatAnalysis.averageBookings.toFixed(1),
        ],
        ["Avg spend by returning guest", data.repeatAnalysis.averageSpend],
      ],
    }),
  ],
  cancellations: [
    (data) => ({
      title: "Cancellation Trend",
      columns: [
        col("day", "Date"),
        numc("cancellations", "Cancellations"),
        pct("cancellationRate", "Rate %"),
        money("revenueLost", "Revenue Lost"),
      ],
      rows: data.cancellationTrend.map((r) => [
        r.day,
        r.cancellations,
        r.cancellationRate,
        r.revenueLost,
      ]),
    }),
    simpleTable("Cancellations by Reason", "reasons", [
      col("name", "Reason"),
      numc("count", "Count"),
      pct("value", "Share %"),
      money("revenueLost", "Revenue Lost"),
    ]),
    simpleTable("Cancellations by Room Type", "roomTypes", [
      col("name", "Room Type"),
      numc("cancellations", "Cancellations"),
    ]),
    simpleTable("Cancellations by Booking Source", "cancellationSources", [
      col("name", "Source"),
      numc("count", "Cancellations"),
      pct("value", "Share %"),
    ]),
    simpleTable("Cancellations by Lead Time", "cancellationLeadTime", [
      col("name", "Lead Time"),
      numc("count", "Cancellations"),
      pct("value", "Share %"),
    ]),
    simpleTable("Cancellation Comparison", "comparison", [
      col("name", "Period"),
      col("value", "Value"),
      col("change", "Change"),
    ]),
  ],
  forecast: [
    (data) => ({
      title: "Next 7 Days",
      columns: [
        col("date", "Date"),
        pct("occupancy", "Occupancy %"),
        money("adr", "ADR"),
        money("revpar", "RevPAR"),
        numc("bookings", "Bookings"),
        money("revenue", "Revenue"),
      ],
      rows: data.nextWeek.map((r) => [
        r.date,
        r.occupancy,
        r.adr,
        r.revpar,
        r.bookings,
        r.revenue,
      ]),
    }),
    (data) => ({
      title: "Forecast Summary",
      columns: [
        col("metric", "Metric"),
        col("next7", "Next 7 Days"),
        col("next30", "Next 30 Days"),
      ],
      rows: [
        [
          "Revenue",
          range2(
            data.forecastSummary.revenue7?.lower,
            data.forecastSummary.revenue7?.upper,
          ),
          range2(
            data.forecastSummary.revenue30?.lower,
            data.forecastSummary.revenue30?.upper,
          ),
        ],
        [
          "ADR",
          range2(
            data.forecastSummary.adr7?.lower,
            data.forecastSummary.adr7?.upper,
          ),
          range2(
            data.forecastSummary.adr30?.lower,
            data.forecastSummary.adr30?.upper,
          ),
        ],
        [
          "Bookings",
          range2(
            data.forecastSummary.bookings7?.lower,
            data.forecastSummary.bookings7?.upper,
          ),
          range2(
            data.forecastSummary.bookings30?.lower,
            data.forecastSummary.bookings30?.upper,
          ),
        ],
      ],
    }),
    simpleTable("Forecasted Demand by Room Type", "roomTypes", [
      col("name", "Room Type"),
      numc("demand", "Room Nights"),
    ]),
    simpleTable("Forecasted Bookings by Source", "sources", [
      col("name", "Source"),
      numc("count", "Bookings"),
    ]),
    simpleTable("Period Forecast vs Actual", "forecastComparison", [
      col("name", "Metric"),
      col("value", "Forecast"),
    ]),
  ],

  // ---- POS Intelligence ----
  sales: [
    seriesTable("Daily Sales", [
      money("total", "Total"),
      money("dine_in", "Dine-in"),
      money("online_delivery", "Online/Delivery"),
      money("takeaway", "Takeaway"),
      money("room_service", "Room Service"),
    ]),
    simpleTable("Sales by Order Type", "orderTypeBreakdown", [
      col("name", "Type"),
      money("value", "Amount"),
    ]),
    simpleTable("Top Selling Items", "topItems", [
      col("name", "Item"),
      numc("quantity", "Quantity Sold"),
      money("revenue", "Revenue"),
      pct("value", "Share %"),
    ]),
    simpleTable("Sales by Category", "categoryBreakdown", [
      col("name", "Category"),
      numc("quantity", "Items Sold"),
      money("revenue", "Revenue"),
    ]),
    simpleTable("Payment Method", "paymentMethods", [
      col("name", "Method"),
      money("amount", "Amount"),
      numc("count", "Orders"),
    ]),
    simpleTable("Sales by Outlet", "outlets", [
      col("name", "Outlet"),
      numc("orders", "Orders"),
      money("revenue", "Revenue"),
      money("avgOrderValue", "Avg Order Value"),
      col("change", "Growth"),
    ]),
  ],
  products: [
    seriesTable("Daily Product Sales", [
      numc("quantity", "Items Sold"),
      money("revenue", "Revenue"),
    ]),
    simpleTable("Product Category Distribution", "categoryDistribution", [
      col("name", "Category"),
      numc("value", "Items Sold"),
    ]),
    simpleTable("Top Selling Products", "topProducts", [
      col("name", "Product"),
      col("category", "Category"),
      numc("quantity", "Quantity Sold"),
      money("revenue", "Revenue"),
    ]),
    simpleTable("Low Performing Products", "lowProducts", [
      col("name", "Product"),
      col("category", "Category"),
      numc("quantity", "Quantity Sold"),
    ]),
    simpleTable("Sales by Category", "categoryTable", [
      col("name", "Category"),
      numc("quantity", "Items Sold"),
      money("revenue", "Revenue"),
      money("avgItemPrice", "Avg Item Price"),
    ]),
  ],
  customers: [
    seriesTable("Daily New vs Returning", [
      numc("newCustomers", "New"),
      numc("returningCustomers", "Returning"),
    ]),
    simpleTable("Customer Type Distribution", "customerTypeMix", [
      col("name", "Type"),
      numc("value", "Customers"),
    ]),
    simpleTable("Top Customers by Spend", "topCustomers", [
      col("name", "Customer"),
      numc("visits", "Visits"),
      money("totalSpend", "Total Spend"),
      money("avgOrderValue", "Avg Order Value"),
    ]),
    simpleTable("Customer Segments (by Lifetime Value)", "segments", [
      col("name", "Segment"),
      numc("count", "Customers"),
    ]),
    simpleTable("Visit Frequency", "visitFrequency", [
      col("name", "Frequency"),
      numc("count", "Customers"),
    ]),
    simpleTable("Customer Acquisition Source", "acquisition", [
      col("name", "Source"),
      numc("value", "Customers"),
    ]),
  ],
  orders: [
    seriesTable("Daily Orders", [
      numc("total", "Total"),
      numc("dine_in", "Dine-in"),
      numc("online_delivery", "Online/Delivery"),
      numc("takeaway", "Takeaway"),
      money("aov", "Avg Order Value"),
    ]),
    simpleTable("Orders by Type", "orderTypeBreakdown", [
      col("name", "Type"),
      numc("value", "Orders"),
    ]),
    simpleTable("Recent Orders", "recentOrders", [
      col("id", "Order ID"),
      col("type", "Type"),
      col("source", "Table / Source"),
      numc("items", "Items"),
      money("amount", "Amount"),
      col("status", "Status"),
    ]),
    simpleTable("Order Status Distribution", "statusBreakdown", [
      col("name", "Status"),
      numc("value", "Orders"),
    ]),
    simpleTable("Top Ordered Items", "topItems", [
      col("name", "Item"),
      numc("orders", "Orders"),
      numc("quantity", "Quantity"),
      money("revenue", "Revenue"),
    ]),
  ],
  upselling: [
    seriesTable("Daily Upsell Revenue", [
      money("revenue", "Upsell Revenue"),
      numc("orders", "Upsell Orders"),
    ]),
    simpleTable("Upsell by Channel", "channelBreakdown", [
      col("name", "Channel"),
      numc("value", "Orders"),
    ]),
    simpleTable("Top Upsold Items", "topUpsoldItems", [
      col("name", "Item"),
      numc("timesUpsold", "Times Upsold"),
      money("revenue", "Revenue"),
    ]),
    simpleTable("Best Performing Combos", "combos", [
      col("name", "Combo"),
      numc("orders", "Orders"),
      money("revenue", "Revenue"),
      pct("conversionRate", "Share of Orders %"),
    ]),
    simpleTable("Upsell by Staff", "byStaff", [
      col("name", "Staff"),
      numc("orders", "Upsell Orders"),
      money("revenue", "Upsell Revenue"),
      pct("conversionRate", "Conversion %"),
    ]),
  ],
  staff: [
    simpleTable("Staff-wise Order Contribution", "contribution", [
      col("name", "Staff"),
      numc("value", "Orders"),
    ]),
    simpleTable("Top Performing Staff", "table", [
      col("name", "Staff"),
      col("role", "Role"),
      numc("orders", "Orders"),
      money("sales", "Sales"),
      money("avgOrderValue", "Avg Order Value"),
      numc("rating", "Rating"),
    ]),
    simpleTable("Service Time by Staff", "serviceTime", [
      col("name", "Staff"),
      numc("avgOrderTime", "Avg Order Time (min)"),
      numc("avgDeliveryTime", "Avg Delivery Time (min)"),
      numc("totalTime", "Total Time (min)"),
    ]),
    simpleTable("Customer Ratings by Staff", "ratings", [
      col("name", "Staff"),
      numc("rating", "Rating"),
    ]),
    simpleTable("Staff Attendance", "attendance", [
      col("name", "Status"),
      numc("value", "Days"),
    ]),
    simpleTable("Sales by Staff Role", "byRole", [
      col("name", "Role"),
      money("value", "Sales"),
    ]),
  ],

  // ---- Business Intelligence ----
  "total-revenue": [
    seriesTable("Total Revenue Trend", [
      money("pms", "PMS (Rooms)"),
      money("pos", "POS (F&B)"),
      money("other", "Other"),
      money("total", "Total"),
    ]),
    simpleTable("Revenue by Source", "revenueBySource", [
      col("name", "Source"),
      money("value", "Amount"),
    ]),
    simpleTable("Revenue by Outlet / Property", "outlets", [
      col("name", "Outlet"),
      money("value", "Revenue"),
    ]),
    simpleTable("Payment Method Split", "paymentMethods", [
      col("name", "Method"),
      money("amount", "Amount"),
    ]),
    simpleTable("Top Revenue Categories (POS)", "topCategories", [
      col("name", "Category"),
      numc("quantity", "Items Sold"),
      money("revenue", "Revenue"),
    ]),
    simpleTable("Top Room Types (PMS)", "topRoomTypes", [
      col("name", "Room Type"),
      numc("nights", "Nights Sold"),
      money("revenue", "Revenue"),
    ]),
  ],
  "pms-pos-revenue": [
    seriesTable("PMS vs POS Revenue Trend", [
      money("pms", "PMS Revenue"),
      money("pos", "POS Revenue"),
      money("total", "Total Revenue"),
    ]),
    simpleTable("Revenue by Day Type", "byDayType", [
      col("name", "Day"),
      money("pms", "PMS"),
      money("pos", "POS"),
    ]),
    simpleTable("Revenue by Guest Type", "guestType", [
      col("name", "Guest Type"),
      money("value", "Revenue"),
    ]),
    simpleTable("Daily Revenue Breakdown", "dailyTable", [
      col("date", "Date"),
      money("pms", "PMS"),
      money("pos", "POS"),
      money("total", "Total"),
      pct("pmsPct", "PMS %"),
      pct("posPct", "POS %"),
    ]),
    simpleTable("Period Comparison", "comparison", [
      col("name", "Metric"),
      col("value", "Value"),
      col("change", "Change"),
    ]),
  ],
  profitability: [
    seriesTable("Revenue, Cost & Profit Trend", [
      money("revenue", "Revenue"),
      money("cost", "Cost"),
      money("profit", "Profit"),
      pct("margin", "Margin %"),
    ]),
    simpleTable("Profitability by Revenue Source", "bySource", [
      col("name", "Source"),
      money("revenue", "Revenue"),
      money("cost", "Cost"),
      money("profit", "Profit"),
      pct("margin", "Margin %"),
    ]),
    simpleTable("Profitability by Outlet", "byOutlet", [
      col("name", "Outlet"),
      money("revenue", "Revenue"),
      money("cost", "Cost"),
      money("profit", "Profit"),
      pct("margin", "Margin %"),
    ]),
    simpleTable("Top Profitable Items (F&B)", "topItems", [
      col("name", "Item"),
      money("revenue", "Revenue"),
      money("cost", "Cost"),
      money("profit", "Profit"),
      pct("margin", "Margin %"),
    ]),
    simpleTable("Top Profitable Room Types", "topRoomTypes", [
      col("name", "Room Type"),
      money("revenue", "Revenue"),
      money("profit", "Profit"),
      pct("margin", "Margin %"),
    ]),
  ],
  conversion: [
    seriesTable("Guest → Restaurant Conversion Trend", [
      numc("inHouse", "In-House Guests"),
      numc("dined", "Dined Guests"),
      pct("conversionRate", "Conversion %"),
    ]),
    simpleTable("Conversion Funnel", "funnel", [
      col("name", "Stage"),
      numc("count", "Guests"),
    ]),
    simpleTable("Conversion by Guest Type", "byPurpose", [
      col("name", "Guest Type"),
      numc("inHouse", "In-House"),
      numc("dined", "Dined"),
      pct("conversionRate", "Conversion %"),
    ]),
    simpleTable("Conversion by Room Type", "byRoomType", [
      col("name", "Room Type"),
      numc("inHouse", "In-House"),
      numc("dined", "Dined"),
      pct("conversionRate", "Conversion %"),
      money("avgSpend", "Avg Spend"),
      money("revenue", "Revenue"),
    ]),
    simpleTable("Top Dining Outlets", "topOutlets", [
      col("name", "Outlet"),
      numc("dined", "Dined Guests"),
      pct("conversionRate", "Conversion %"),
      money("revenue", "Revenue"),
    ]),
    simpleTable("Top Dining Items", "topItems", [
      col("name", "Item"),
      numc("orders", "Orders"),
      money("revenue", "Revenue"),
    ]),
  ],
  "guest-spending": [
    seriesTable("Guest Spending Trend", [
      money("totalSpend", "Total Spend"),
      money("avgSpend", "Avg Spend per Guest"),
    ]),
    simpleTable("Guest Spending by Category", "categoryBreakdown", [
      col("name", "Category"),
      money("value", "Amount"),
    ]),
    simpleTable("Average Spend by Stay Type", "byStayType", [
      col("name", "Stay Type"),
      money("roomSpend", "Room Spend"),
      money("posSpend", "POS Spend"),
    ]),
    simpleTable("Average Spend by Guest Type", "byGuestType", [
      col("name", "Guest Type"),
      money("roomSpend", "Room Spend"),
      money("posSpend", "POS Spend"),
    ]),
    simpleTable("Top Guests by Spending", "topGuests", [
      col("name", "Guest"),
      money("roomSpend", "Room Spend"),
      money("posSpend", "POS Spend"),
      money("totalSpend", "Total Spend"),
      numc("nights", "Nights"),
    ]),
    simpleTable("Top Rooms by Guest Spending", "topRooms", [
      col("name", "Room Type"),
      numc("guests", "Guests"),
      money("posSpend", "POS Spend"),
    ]),
  ],
  "revenue-forecast": [
    seriesTable("Revenue Forecast Trend", [
      money("pms", "Room Revenue"),
      money("pos", "F&B Revenue"),
      money("total", "Total Revenue"),
      pct("occupancy", "Occupancy %"),
    ]),
    simpleTable("Daily Forecast (Next 7 Days)", "next7", [
      col("day", "Date"),
      pct("occupancy", "Occupancy %"),
      money("pms", "Room Revenue"),
      money("pos", "F&B Revenue"),
      money("total", "Total Revenue"),
    ]),
    simpleTable("Monthly Forecast by Revenue Source", "bySource", [
      col("period", "Period"),
      money("pms", "Room Revenue"),
      money("pos", "F&B Revenue"),
      money("total", "Total Revenue"),
      col("growth", "Growth"),
    ]),
  ],
  clv: [
    simpleTable("CLV Trend", "trend", [
      col("day", "Month"),
      money("clv", "Avg CLV"),
      money("totalRevenue", "Total Revenue"),
    ]),
    simpleTable("Guest Segmentation by Lifetime Value", "segmentation", [
      col("name", "Segment"),
      numc("count", "Guests"),
      money("revenue", "Revenue"),
    ]),
    simpleTable("CLV by Guest Type", "byPurpose", [
      col("name", "Guest Type"),
      money("avgClv", "Avg CLV"),
    ]),
    simpleTable("Top 10 Guests by Lifetime Value", "top10", [
      col("name", "Guest"),
      numc("stays", "Total Stays"),
      money("totalSpend", "Total Spend"),
      money("clv", "CLV"),
    ]),
    simpleTable("Revenue Contribution by Segment", "revenueContribution", [
      col("name", "Segment"),
      money("value", "Revenue"),
    ]),
    simpleTable("CLV Distribution", "distribution", [
      col("range", "CLV Range"),
      numc("guests", "Guests"),
      pct("pct", "Share %"),
    ]),
  ],
  recommendations: [
    simpleTable("AI Recommendations", "recommendations", [
      col("title", "Recommendation"),
      col("category", "Category"),
      col("priority", "Priority"),
      money("estMonthlyImpact", "Est. Monthly Impact"),
      col("effort", "Effort"),
      col("status", "Status"),
    ]),
    simpleTable("Opportunity Breakdown", "byCategory", [
      col("name", "Category"),
      numc("value", "Suggestions"),
    ]),
    simpleTable("Revenue Uplift Potential", "upliftByCategory", [
      col("name", "Category"),
      money("current", "Current Revenue"),
      money("potential", "Potential Revenue"),
    ]),
  ],
};

/** Returns { meta, kpis, tables, insights } — everything both exporters need, nothing format-specific. */
export function getReportSections(id, data) {
  const meta = {
    title: `${data.module || "PMS Intelligence"} — ${data.title}`,
    subtitle: data.subtitle,
    range: data.range,
    generatedAt: data.generatedAt,
    source: data.source,
    hotel: "Shubham Palace",
  };
  const kpis = (data.metrics || []).map((m) => ({
    label: m.label,
    value: m.value,
    change: m.change,
  }));
  const tables = (BUILDERS[id] || []).map((build) => build(data));
  return { meta, kpis, tables, insights: data.insights };
}
