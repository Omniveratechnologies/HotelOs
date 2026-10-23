// Pure computation layer for POS Intelligence — mirrors src/lib/dashboard-shape.js's role for
// PMS: live-data.js and demo-data.js both build the same "raw" shape and hand it to the
// compute* functions here, so live MongoDB output and synthetic demo output are guaranteed
// identical in structure. Unlike PMS, POS breakdowns are queried directly against a single
// [selectedStart, end) window (no doubled comparison window) — a previous-period TOTAL is
// fetched separately, only for the handful of numbers that need a "vs previous" delta.
import { POS_DASHBOARDS } from "./intelligence-data.js";

export const dayMs = 24 * 60 * 60 * 1000;
export const money = (v) => `₹${Math.round(v || 0).toLocaleString("en-IN")}`;
export const dateLabel = (date) =>
  `${date.getUTCDate()} ${date.toLocaleString("en", { month: "short", timeZone: "UTC" })}`;
export const rangeSize = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };
export const colors = [
  "#157a70",
  "#d47748",
  "#6b7cae",
  "#b98b38",
  "#478a66",
  "#9b6a8d",
];
export const HOUR_BLOCKS = [
  [6, 9, "6AM–9AM"],
  [9, 12, "9AM–12PM"],
  [12, 15, "12PM–3PM"],
  [15, 18, "3PM–6PM"],
  [18, 21, "6PM–9PM"],
  [21, 24, "9PM–12AM"],
];
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function dayKey(value) {
  return new Date(new Date(value).getTime() + 330 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function computeWindows(range, now = new Date()) {
  const days = rangeSize[range] || 30;
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() + 1);
  const selectedStart = new Date(end.getTime() - days * dayMs);
  const previousStart = new Date(selectedStart.getTime() - days * dayMs);
  return { days, end, selectedStart, previousStart };
}

export const pctChange = (current, previous) => {
  if (!previous) return current ? "+100.0%" : "0.0%";
  const v = ((current - previous) / previous) * 100;
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
};
const changeOrDash = (current, previous) =>
  previous == null ? "—" : pctChange(current, previous);

function withColor(rows) {
  return rows.map((r, i) => ({ ...r, color: colors[i % colors.length] }));
}
const seriesDay = (date) => ({ date: dayKey(date), day: dateLabel(date) });

// ---------------- Sales ----------------
export function computeSales({ days, selectedStart }, raw) {
  const {
    dailyTypeRows,
    previousTotal,
    itemRows,
    itemsSoldTotal,
    previousItemsSoldTotal,
    categoryRows,
    paymentRows,
    orderTypeRows,
    outletRows,
    outletPreviousRows,
    hourRows,
  } = raw;

  const byDay = new Map();
  for (let i = 0; i < days; i++) {
    const date = new Date(selectedStart.getTime() + i * dayMs);
    byDay.set(dayKey(date), {
      ...seriesDay(date),
      total: 0,
      dine_in: 0,
      online_delivery: 0,
      takeaway: 0,
      room_service: 0,
    });
  }
  for (const row of dailyTypeRows) {
    const k = dayKey(row._id.day);
    const bucket = byDay.get(k);
    if (!bucket) continue;
    bucket[row._id.orderType] = (bucket[row._id.orderType] || 0) + row.amount;
    bucket.total += row.amount;
  }
  const series = Array.from(byDay.values());

  const totalSales = orderTypeRows.reduce((s, r) => s + r.amount, 0);
  const totalOrders = orderTypeRows.reduce((s, r) => s + r.count, 0);
  const dineIn = orderTypeRows.find((r) => r._id === "dine_in") || {
    amount: 0,
  };
  const online = orderTypeRows.find((r) => r._id === "online_delivery") || {
    amount: 0,
  };

  const metrics = [
    {
      label: "Total Sales",
      icon: "IndianRupee",
      value: money(totalSales),
      change: changeOrDash(totalSales, previousTotal?.amount),
    },
    {
      label: "Total Orders",
      icon: "ClipboardList",
      value: totalOrders.toLocaleString("en-IN"),
      change: changeOrDash(totalOrders, previousTotal?.count),
    },
    {
      label: "Average Order Value",
      icon: "Users",
      value: money(totalOrders ? totalSales / totalOrders : 0),
      change: changeOrDash(
        totalOrders ? totalSales / totalOrders : 0,
        previousTotal?.count
          ? previousTotal.amount / previousTotal.count
          : null,
      ),
    },
    {
      label: "Total Items Sold",
      icon: "Package",
      value: itemsSoldTotal.toLocaleString("en-IN"),
      change: changeOrDash(itemsSoldTotal, previousItemsSoldTotal),
    },
    {
      label: "Dine-in Sales",
      icon: "ConciergeBell",
      value: `${money(dineIn.amount)} (${totalSales ? Math.round((dineIn.amount / totalSales) * 100) : 0}%)`,
      change: "share of total",
    },
    {
      label: "Online/Delivery Sales",
      icon: "Truck",
      value: `${money(online.amount)} (${totalSales ? Math.round((online.amount / totalSales) * 100) : 0}%)`,
      change: "share of total",
    },
  ];

  return {
    metrics,
    series,
    orderTypeBreakdown: withColor(
      orderTypeRows.map((r) => ({ name: labelType(r._id), value: r.amount })),
    ),
    topItems: itemRows.map((r) => ({
      name: r._id,
      quantity: r.quantity,
      revenue: r.revenue,
      value: totalSales ? (r.revenue / totalSales) * 100 : 0,
    })),
    categoryBreakdown: withColor(
      categoryRows.map((r) => ({
        name: r._id,
        revenue: r.revenue,
        quantity: r.quantity,
      })),
    ),
    paymentMethods: withColor(
      paymentRows.map((r) => ({
        name: r._id,
        amount: r.amount,
        count: r.count,
      })),
    ),
    outlets: outletRows.map((r) => {
      const prev = outletPreviousRows.find((p) => p._id === r._id);
      return {
        name: r._id,
        orders: r.orders,
        revenue: r.revenue,
        avgOrderValue: r.orders ? r.revenue / r.orders : 0,
        change: changeOrDash(r.revenue, prev?.revenue),
      };
    }),
    peakHours: Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: hourRows.find((r) => r._id === h)?.count || 0,
    })),
    summary: {
      totalSales,
      totalOrders,
      avgOrderValue: totalOrders ? totalSales / totalOrders : 0,
      itemsSold: itemsSoldTotal,
    },
  };
}
const labelType = (t) =>
  ({
    dine_in: "Dine-in",
    online_delivery: "Online Delivery",
    takeaway: "Takeaway",
    room_service: "Room Service",
  })[t] || t;

// ---------------- Products ----------------
export function computeProducts({ days, selectedStart }, raw) {
  const {
    totalProducts,
    dailyRows,
    itemsSoldTotal,
    previousItemsSoldTotal,
    allItemRows,
    categoryRows,
    hourWeekdayRows,
  } = raw;

  const byDay = new Map();
  for (let i = 0; i < days; i++) {
    const date = new Date(selectedStart.getTime() + i * dayMs);
    byDay.set(dayKey(date), { ...seriesDay(date), quantity: 0, revenue: 0 });
  }
  for (const row of dailyRows) {
    const b = byDay.get(dayKey(row._id));
    if (b) {
      b.quantity += row.quantity;
      b.revenue += row.revenue;
    }
  }
  const series = Array.from(byDay.values());

  const revenue = allItemRows.reduce((s, r) => s + r.revenue, 0);
  const sorted = [...allItemRows].sort((a, b) => b.quantity - a.quantity);
  const top = sorted.slice(0, 5);
  const cutoff = Math.max(1, Math.round(sorted.length * 0.2));
  const low = sorted.slice(-cutoff).reverse();
  const topProduct = sorted[0];

  const metrics = [
    {
      label: "Total Products",
      icon: "Package",
      value: totalProducts.toLocaleString("en-IN"),
      change: "—",
    },
    {
      label: "Items Sold",
      icon: "ShoppingCart",
      value: itemsSoldTotal.toLocaleString("en-IN"),
      change: changeOrDash(itemsSoldTotal, previousItemsSoldTotal),
    },
    {
      label: "Top Selling Product",
      icon: "Tag",
      value: topProduct ? topProduct._id : "—",
      change: topProduct ? `${topProduct.quantity} sold` : "—",
    },
    {
      label: "Product Revenue",
      icon: "IndianRupee",
      value: money(revenue),
      change: "—",
    },
    {
      label: "Avg Item Price",
      icon: "Percent",
      value: money(itemsSoldTotal ? revenue / itemsSoldTotal : 0),
      change: "—",
    },
    {
      label: "Low Performing Items",
      icon: "TrendingDown",
      value: low.length.toLocaleString("en-IN"),
      change: `bottom 20% by qty`,
    },
  ];

  return {
    metrics,
    series,
    categoryDistribution: withColor(
      categoryRows.map((r) => ({ name: r._id, value: r.quantity })),
    ),
    topProducts: top.map((r) => ({
      name: r._id,
      category: r.category,
      quantity: r.quantity,
      revenue: r.revenue,
      value: revenue ? (r.revenue / revenue) * 100 : 0,
    })),
    lowProducts: low.map((r) => ({
      name: r._id,
      category: r.category,
      quantity: r.quantity,
    })),
    categoryTable: withColor(
      categoryRows.map((r) => ({
        name: r._id,
        quantity: r.quantity,
        revenue: r.revenue,
        avgItemPrice: r.quantity ? r.revenue / r.quantity : 0,
      })),
    ),
    hourHeatmap: HOUR_BLOCKS.map(([, , label]) => ({
      name: label,
      values: WEEKDAYS.map(
        (_, wi) =>
          hourWeekdayRows.find(
            (r) => r._id.block === label && r._id.weekday === wi,
          )?.quantity || 0,
      ),
    })),
    summary: { totalProducts, itemsSold: itemsSoldTotal, revenue },
  };
}

// ---------------- Customers ----------------
export function computeCustomers({ days, selectedStart }, raw) {
  const {
    totalCustomersCurrent,
    newCustomers,
    returningCustomers,
    previousTotalCustomers,
    spendTotal,
    retentionRows,
    dailyNewReturning,
    topCustomers,
    segmentRows,
    visitFreqRows,
    acquisitionRows,
    cumulativeRows,
  } = raw;

  const byDay = new Map();
  for (let i = 0; i < days; i++) {
    const date = new Date(selectedStart.getTime() + i * dayMs);
    byDay.set(dayKey(date), {
      ...seriesDay(date),
      newCustomers: 0,
      returningCustomers: 0,
    });
  }
  for (const row of dailyNewReturning) {
    const b = byDay.get(dayKey(row._id));
    if (b) {
      b.newCustomers = row.newCount;
      b.returningCustomers = row.returningCount;
    }
  }
  const series = Array.from(byDay.values());

  const retention = totalCustomersCurrent
    ? (returningCustomers / totalCustomersCurrent) * 100
    : 0;
  const metrics = [
    {
      label: "Total Customers",
      icon: "Users",
      value: totalCustomersCurrent.toLocaleString("en-IN"),
      change: changeOrDash(totalCustomersCurrent, previousTotalCustomers),
    },
    {
      label: "New Customers",
      icon: "UserPlus",
      value: newCustomers.toLocaleString("en-IN"),
      change: "—",
    },
    {
      label: "Returning Customers",
      icon: "Repeat",
      value: returningCustomers.toLocaleString("en-IN"),
      change: "—",
    },
    {
      label: "Avg Spend per Customer",
      icon: "IndianRupee",
      value: money(
        totalCustomersCurrent ? spendTotal / totalCustomersCurrent : 0,
      ),
      change: "—",
    },
    {
      label: "Customer Retention Rate",
      icon: "Star",
      value: `${retention.toFixed(0)}%`,
      change: "—",
    },
  ];

  let running = 0;
  const growthTrend = cumulativeRows
    .map((r) => {
      running += r.newCount;
      return {
        date: r._id,
        day: dateLabel(r._id),
        newCustomers: r.newCount,
        totalCustomers: running,
      };
    })
    .filter((r) => r.date >= selectedStart); // accumulate over all history, but only chart the selected window

  return {
    metrics,
    series,
    customerTypeMix: withColor(
      retentionRows.map((r) => ({ name: labelType(r._id), value: r.count })),
    ),
    topCustomers: topCustomers.map((r) => ({
      name: r.name || "Guest",
      visits: r.visits,
      totalSpend: r.totalSpend,
      avgOrderValue: r.visits ? r.totalSpend / r.visits : 0,
    })),
    segments: withColor(segmentRows),
    visitFrequency: visitFreqRows,
    acquisition: withColor(
      acquisitionRows.map((r) => ({ name: r._id, value: r.count })),
    ),
    growthTrend,
    repeatRate: retention,
    summary: {
      totalCustomers: totalCustomersCurrent,
      newCustomers,
      returningCustomers,
      avgSpend: totalCustomersCurrent ? spendTotal / totalCustomersCurrent : 0,
      retentionRate: retention,
    },
  };
}

// ---------------- Orders ----------------
export function computeOrders({ days, selectedStart }, raw) {
  const {
    orderTypeRows,
    previousOrderTotal,
    avgOrderTime,
    statusRows,
    dailyTypeRows,
    dailyAovRows,
    topItems,
    hourRows,
    recentOrders,
  } = raw;

  const byDay = new Map();
  for (let i = 0; i < days; i++) {
    const date = new Date(selectedStart.getTime() + i * dayMs);
    byDay.set(dayKey(date), {
      ...seriesDay(date),
      total: 0,
      dine_in: 0,
      online_delivery: 0,
      takeaway: 0,
      room_service: 0,
      aov: 0,
    });
  }
  for (const row of dailyTypeRows) {
    const b = byDay.get(dayKey(row._id.day));
    if (b) {
      b[row._id.orderType] = (b[row._id.orderType] || 0) + row.count;
      b.total += row.count;
    }
  }
  for (const row of dailyAovRows) {
    const b = byDay.get(dayKey(row._id));
    if (b) b.aov = row.count ? row.amount / row.count : 0;
  }
  const series = Array.from(byDay.values());

  const totalOrders = orderTypeRows.reduce((s, r) => s + r.count, 0);
  const totalAmount = orderTypeRows.reduce((s, r) => s + r.amount, 0);
  const byType = (t) => orderTypeRows.find((r) => r._id === t) || { count: 0 };

  const metrics = [
    {
      label: "Total Orders",
      icon: "ClipboardList",
      value: totalOrders.toLocaleString("en-IN"),
      change: changeOrDash(totalOrders, previousOrderTotal?.count),
    },
    {
      label: "Avg Order Time",
      icon: "Clock",
      value: `${Math.round(avgOrderTime)} mins`,
      change: "—",
    },
    {
      label: "Avg Order Value",
      icon: "IndianRupee",
      value: money(totalOrders ? totalAmount / totalOrders : 0),
      change: "—",
    },
    {
      label: "Dine-in Orders",
      icon: "ConciergeBell",
      value: `${byType("dine_in").count.toLocaleString("en-IN")} (${totalOrders ? Math.round((byType("dine_in").count / totalOrders) * 100) : 0}%)`,
      change: "share of total",
    },
    {
      label: "Online/Delivery Orders",
      icon: "Truck",
      value: `${byType("online_delivery").count.toLocaleString("en-IN")} (${totalOrders ? Math.round((byType("online_delivery").count / totalOrders) * 100) : 0}%)`,
      change: "share of total",
    },
    {
      label: "Takeaway Orders",
      icon: "ShoppingBag",
      value: `${byType("takeaway").count.toLocaleString("en-IN")} (${totalOrders ? Math.round((byType("takeaway").count / totalOrders) * 100) : 0}%)`,
      change: "share of total",
    },
  ];

  return {
    metrics,
    series,
    orderTypeBreakdown: withColor(
      orderTypeRows.map((r) => ({ name: labelType(r._id), value: r.count })),
    ),
    recentOrders,
    statusBreakdown: withColor(
      statusRows.map((r) => ({ name: labelStatus(r._id), value: r.count })),
    ),
    topItems: topItems.map((r) => ({
      name: r._id,
      orders: r.orders,
      quantity: r.quantity,
      revenue: r.revenue,
      value: totalOrders ? (r.orders / totalOrders) * 100 : 0,
    })),
    peakHours: Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: hourRows.find((r) => r._id === h)?.count || 0,
    })),
    summary: {
      totalOrders,
      avgOrderTime,
      avgOrderValue: totalOrders ? totalAmount / totalOrders : 0,
    },
  };
}
const labelStatus = (s) =>
  ({
    pending: "Pending",
    preparing: "Preparing",
    out_for_delivery: "Out for Delivery",
    completed: "Completed",
    cancelled: "Cancelled",
  })[s] || s;

// ---------------- Upselling ----------------
export function computeUpselling({ days, selectedStart }, raw) {
  const {
    dailyUpsellRows,
    totalOrders,
    upsellOrders,
    previousUpsellRevenue,
    upsellRevenue,
    totalSales,
    channelRows,
    topUpsoldItems,
    comboRows,
    hourRows,
    staffRows,
  } = raw;

  const byDay = new Map();
  for (let i = 0; i < days; i++) {
    const date = new Date(selectedStart.getTime() + i * dayMs);
    byDay.set(dayKey(date), { ...seriesDay(date), revenue: 0, orders: 0 });
  }
  for (const row of dailyUpsellRows) {
    const b = byDay.get(dayKey(row._id));
    if (b) {
      b.revenue = row.revenue;
      b.orders = row.orders;
    }
  }
  const series = Array.from(byDay.values()).map((d) => ({
    ...d,
    conversionRate: null,
  }));

  const conversionRate = totalOrders ? (upsellOrders / totalOrders) * 100 : 0;
  const avgOrderValueWithUpsell = raw.avgOrderValueWithUpsell || 0;
  const revenueLift =
    totalSales - upsellRevenue > 0
      ? (upsellRevenue / (totalSales - upsellRevenue)) * 100
      : 0;

  const metrics = [
    {
      label: "Upsell Revenue",
      icon: "IndianRupee",
      value: money(upsellRevenue),
      change: changeOrDash(upsellRevenue, previousUpsellRevenue),
    },
    {
      label: "Upsell Conversion Rate",
      icon: "Percent",
      value: `${conversionRate.toFixed(1)}%`,
      change: "—",
    },
    {
      label: "Avg Order Value (With Upsell)",
      icon: "Users",
      value: money(avgOrderValueWithUpsell),
      change: "—",
    },
    {
      label: "Upsell Orders",
      icon: "Gift",
      value: upsellOrders.toLocaleString("en-IN"),
      change: "—",
    },
    {
      label: "Revenue Lift from Upsell",
      icon: "TrendingUp",
      value: `${revenueLift.toFixed(1)}%`,
      change: "—",
    },
  ];

  return {
    metrics,
    series,
    channelBreakdown: withColor(
      channelRows.map((r) => ({ name: labelType(r._id), value: r.count })),
    ),
    topUpsoldItems: topUpsoldItems.map((r) => ({
      name: r._id,
      timesUpsold: r.count,
      revenue: r.revenue,
      value: upsellOrders ? (r.count / upsellOrders) * 100 : 0,
    })),
    combos: comboRows.map((r) => ({
      name: `${r.a} + ${r.b}`,
      orders: r.orders,
      revenue: r.revenue,
      conversionRate: totalOrders ? (r.orders / totalOrders) * 100 : 0,
    })),
    peakHours: Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: hourRows.find((r) => r._id === h)?.count || 0,
    })),
    byStaff: staffRows.map((r) => ({
      name: r.name,
      orders: r.upsellOrders,
      revenue: r.revenue,
      conversionRate: r.totalOrders
        ? (r.upsellOrders / r.totalOrders) * 100
        : 0,
    })),
    summary: { upsellRevenue, conversionRate, upsellOrders, revenueLift },
  };
}

// ---------------- Staff ----------------
export function computeStaff({ days, selectedStart }, raw) {
  const {
    totalStaff,
    dailyTop5Rows,
    top5Names,
    contributionRows,
    totalOrdersHandled,
    tableRows,
    ratingRows,
    attendanceRows,
    roleRows,
    avgServiceTime,
    avgRating,
    totalStaffSales,
  } = raw;

  const byDay = new Map();
  for (let i = 0; i < days; i++) {
    const date = new Date(selectedStart.getTime() + i * dayMs);
    byDay.set(dayKey(date), { ...seriesDay(date) });
  }
  for (const row of dailyTop5Rows) {
    const b = byDay.get(dayKey(row._id.day));
    if (b) b[row._id.name] = row.amount;
  }
  const series = Array.from(byDay.values());

  const metrics = [
    {
      label: "Total Staff",
      icon: "Users",
      value: totalStaff.toLocaleString("en-IN"),
      change: "—",
    },
    {
      label: "Total Sales by Staff",
      icon: "IndianRupee",
      value: money(totalStaffSales),
      change: "—",
    },
    {
      label: "Total Orders Handled",
      icon: "ClipboardList",
      value: totalOrdersHandled.toLocaleString("en-IN"),
      change: "—",
    },
    {
      label: "Avg Service Time",
      icon: "Clock",
      value: `${Math.round(avgServiceTime)} mins`,
      change: "—",
    },
    {
      label: "Customer Rating",
      icon: "Star",
      value: `${avgRating.toFixed(1)} / 5`,
      change: "—",
    },
  ];

  return {
    metrics,
    series,
    top5Names,
    contribution: withColor(
      contributionRows.map((r) => ({ name: r.name, value: r.count })),
    ),
    table: tableRows.map((r) => ({
      name: r.name,
      role: r.role,
      orders: r.orders,
      sales: r.sales,
      avgOrderValue: r.orders ? r.sales / r.orders : 0,
      rating: r.rating,
    })),
    serviceTime: tableRows.map((r) => ({
      name: r.name,
      avgOrderTime: r.avgPrep,
      avgDeliveryTime: r.avgDelivery,
      totalTime: (r.avgPrep || 0) + (r.avgDelivery || 0),
    })),
    ratings: ratingRows.map((r) => ({ name: r.name, rating: r.rating })),
    attendance: withColor(
      attendanceRows.map((r) => ({
        name: labelAttendance(r._id),
        value: r.count,
      })),
    ),
    byRole: withColor(roleRows.map((r) => ({ name: r._id, value: r.sales }))),
    summary: {
      totalStaff,
      totalStaffSales,
      totalOrdersHandled,
      avgServiceTime,
      avgRating,
    },
  };
}
const labelAttendance = (s) =>
  ({
    present: "Present",
    absent: "Absent",
    on_leave: "On Leave",
    half_day: "Half Day",
  })[s] || s;

const DISPATCH = {
  sales: computeSales,
  products: computeProducts,
  customers: computeCustomers,
  orders: computeOrders,
  upselling: computeUpselling,
  staff: computeStaff,
};

export function computePosPayload(id, range, windows, raw, source = "live") {
  const body = DISPATCH[id](windows, raw);
  const meta = POS_DASHBOARDS[id];
  return {
    id,
    module: "POS Intelligence",
    title: meta.title,
    subtitle: meta.subtitle,
    range,
    generatedAt: new Date().toISOString(),
    source,
    ...body,
  };
}
