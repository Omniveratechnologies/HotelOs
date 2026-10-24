// Pure computation layer shared by the live (MongoDB) and demo data sources.
// Given the raw aggregation-shaped rows (whether they came from Mongo or were
// synthesized in memory), this produces the exact payload every dashboard page
// consumes. Keeping this pure means live and demo mode are guaranteed to render
// identically-shaped data, and it's trivially unit-testable without a database.
import { DASHBOARDS } from "./intelligence-data.js";

export const dayMs = 24 * 60 * 60 * 1000;
export const colors = [
  "#157a70",
  "#d47748",
  "#6b7cae",
  "#b98b38",
  "#478a66",
  "#9b6a8d",
];
export const money = (value) =>
  `₹${Math.round(value || 0).toLocaleString("en-IN")}`;
export const dateLabel = (date) =>
  `${date.getUTCDate()} ${date.toLocaleString("en", { month: "short", timeZone: "UTC" })}`;
export const rangeSize = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };

export function dayKey(value) {
  return new Date(new Date(value).getTime() + 330 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function blankDay(date) {
  return {
    date: dayKey(date),
    day: dateLabel(date),
    total: 0,
    room: 0,
    services: 0,
    foodBeverage: 0,
    miscellaneous: 0,
    occupancyPct: 0,
    adr: 0,
    revpar: 0,
    bookings: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    noShows: 0,
    guests: 0,
    newGuests: 0,
    returningGuests: 0,
    cancellations: 0,
    cancellationRate: 0,
    revenueLost: 0,
    cancelledRoomNights: 0,
    avgDaysBeforeCancel: 0,
  };
}

export function total(rows, key) {
  return rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
}

/** Date windows for a given range, anchored to "now". Shared by live queries and the demo generator. */
export function computeWindows(range, now = new Date()) {
  const days = rangeSize[range] || 30;
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() + 1);
  const selectedStart = new Date(end.getTime() - days * dayMs);
  const queryStart = new Date(end.getTime() - days * 2 * dayMs);
  const futureEnd = new Date(end.getTime() + days * dayMs);
  return { days, end, selectedStart, queryStart, futureEnd };
}

/**
 * Pure transform: raw (Mongo-aggregation-shaped, or synthesized) rows -> the full dashboard payload.
 * `raw.rateHeatmapRows` must already be non-empty by the time it reaches here (the live wrapper
 * runs a fallback query if the primary one comes back empty; the demo generator never returns empty).
 */
export function computeDashboardPayload({
  id,
  range,
  hotelId,
  days,
  end,
  selectedStart,
  queryStart,
  raw,
  source = "live",
}) {
  const {
    rollups,
    invoiceDays,
    occupancyRows,
    rateHeatmapRows,
    adrRows,
    reservationDays,
    bookingDays,
    bookingLeadRows,
    roomTypeRows,
    sourceRows,
    paymentRows,
    weekdayRows,
    roomsByType,
    nationalityRows,
    cityRows,
    purposeRows,
    occupancyDetailRows,
    rawOccupancyRows,
    guestAgeRows,
    guestCohortRows,
    stayDurationRows,
    cancellationSourceRows,
    cancellationLeadRows,
    reservationCancellationReasons,
    cancellationRows,
    cancellationReasons,
    forecastRows,
  } = raw;

  // Calculate inventory before any derived arrays use it.
  const totalRooms = roomsByType.reduce(
    (sum, row) => sum + Number(row.total || 0),
    0,
  );

  const series = Array.from({ length: days * 2 }, (_, index) =>
    blankDay(new Date(queryStart.getTime() + index * dayMs)),
  );
  const byDate = new Map(series.map((row) => [row.date, row]));
  const rateHeatmapData = rateHeatmapRows;

  const rollupDates = new Set();
  for (const row of rollups) {
    const key = dayKey(row._id);
    const target = byDate.get(key);
    if (target) {
      Object.assign(target, {
        total: row.total,
        room: row.room,
        services: row.services,
        foodBeverage: row.foodBeverage,
        miscellaneous: row.miscellaneous,
        bookings: row.bookings,
        roomNights: row.roomNights,
      });
      rollupDates.add(key);
    }
  }

  for (const row of invoiceDays) {
    const target = byDate.get(dayKey(row._id.date));
    if (!target || rollupDates.has(target.date)) continue;
    const category = row._id.category;
    const amount = Number(row.amount || 0);
    if (category === "room") target.room += amount;
    else {
      target.services += amount;
      if (category === "food_beverage") target.foodBeverage += amount;
      if (category === "miscellaneous") target.miscellaneous += amount;
    }
    target.total += amount;
  }

  for (const row of reservationDays) {
    const target = byDate.get(dayKey(row._id));
    if (!target) continue;
    target.roomNights = row.roomNights;
    if (!rollupDates.has(target.date) && target.room === 0) {
      target.room = row.roomRevenue;
      target.total = Math.max(target.total, target.room + target.services);
    }
  }

  const occupancyMap = new Map(
    occupancyRows.map((row) => [dayKey(row._id), row]),
  );
  const adrMap = new Map(adrRows.map((row) => [dayKey(row._id), row]));
  const occupiedByDate = new Map();
  for (const row of occupancyDetailRows) {
    const day = (row._id.day + 5) % 7;
    const heatmapRow = occupiedByDate.get(row._id.roomType) || Array(7).fill(0);
    heatmapRow[day] = row.occupancyPct;
    occupiedByDate.set(row._id.roomType, heatmapRow);
  }

  const rawOccupancyByDate = new Map();
  const rawHeatmapTotals = new Map();
  const rawHeatmapCounts = new Map();
  for (const row of rawOccupancyRows) {
    const key = dayKey(row._id.date);
    rawOccupancyByDate.set(
      key,
      (rawOccupancyByDate.get(key) || 0) + row.occupied,
    );
    const weekday = (new Date(`${key}T00:00:00Z`).getUTCDay() + 6) % 7;
    const totals = rawHeatmapTotals.get(row._id.roomType) || Array(7).fill(0);
    const counts = rawHeatmapCounts.get(row._id.roomType) || Array(7).fill(0);
    const inventory =
      roomsByType.find((room) => room._id === row._id.roomType)?.total || 0;
    totals[weekday] += inventory ? (row.occupied / inventory) * 100 : 0;
    counts[weekday] += 1;
    rawHeatmapTotals.set(row._id.roomType, totals);
    rawHeatmapCounts.set(row._id.roomType, counts);
  }

  for (const row of bookingDays) {
    const target = byDate.get(dayKey(row._id.date));
    if (!target) continue;
    const status = row._id.status;
    target.bookings += row.count;
    target.guests += row.guests;
    if (["confirmed", "checked_in", "checked_out"].includes(status))
      target.confirmed += row.count;
    if (status === "pending") target.pending += row.count;
    if (status === "cancelled") target.cancelled += row.count;
    if (status === "no_show") target.noShows += row.count;
  }

  for (const target of series) {
    const occupancy = occupancyMap.get(target.date);
    const adr = adrMap.get(target.date);
    if (occupancy)
      target.occupancyPct =
        occupancy.occupied + occupancy.available
          ? (occupancy.occupied / (occupancy.occupied + occupancy.available)) *
            100
          : 0;
    else if (totalRooms)
      target.occupancyPct =
        ((rawOccupancyByDate.get(target.date) || 0) / totalRooms) * 100;
    if (adr) target.adr = adr.roomNights ? adr.roomRevenue / adr.roomNights : 0;
    else if (target.roomNights) target.adr = target.room / target.roomNights;
    if (occupancy)
      target.revpar =
        occupancy.occupied + occupancy.available
          ? target.room / (occupancy.occupied + occupancy.available)
          : 0;
    else target.revpar = (target.adr * target.occupancyPct) / 100;
  }

  const selected = series.slice(-days);
  const previous = series.slice(0, days);
  const selectedRevenue = total(selected, "total");
  const selectedRoomRevenue = total(selected, "room");
  const selectedServicesRevenue = total(selected, "services");
  const selectedFoodBeverageRevenue = total(selected, "foodBeverage");
  const selectedMiscellaneousRevenue = total(selected, "miscellaneous");
  const selectedOtherServicesRevenue = Math.max(
    selectedServicesRevenue -
      selectedFoodBeverageRevenue -
      selectedMiscellaneousRevenue,
    0,
  );
  const selectedBookings = total(selected, "bookings");
  let selectedCancellations = total(selected, "cancelled");
  const previousRevenue = total(previous, "total");
  const growth = previousRevenue
    ? ((selectedRevenue - previousRevenue) / previousRevenue) * 100
    : 0;
  const avg = (key) =>
    selected.length ? total(selected, key) / selected.length : 0;

  const totalRoomNights =
    total(selected, "roomNights") ||
    (avg("occupancyPct") * totalRooms * selected.length) / 100;
  const totalGuests = Number(guestCohortRows[0]?.total || 0);
  const returningGuestCount = Number(guestCohortRows[0]?.returning || 0);
  const newGuestCount = Math.max(totalGuests - returningGuestCount, 0);
  const reservationCount = Math.max(1, total(selected, "bookings"));

  const roomTypes = roomTypeRows.map((row, index) => {
    const inventory =
      roomsByType.find((room) => room._id === row._id)?.total || 0;
    const adr = row.nights ? row.amount / row.nights : 0;
    return {
      name: row._id || "Unspecified",
      bookings: row.count,
      revenue: row.amount,
      adr,
      occupancy: inventory
        ? Math.min(100, (row.nights / Math.max(inventory * days, 1)) * 100)
        : 0,
      revpar: inventory ? row.amount / (inventory * days) : 0,
      cancellations: row.cancellations,
      demand: row.nights,
      color: colors[index % colors.length],
    };
  });

  const sources = sourceRows.map((row, index) => ({
    name: row._id || "Unspecified",
    short: row._id || "Unspecified",
    count: row.count,
    value: (row.count / reservationCount) * 100,
    revenue: row.amount,
    adr: row.nights ? row.amount / row.nights : 0,
    revpar: row.amount / Math.max(totalRooms * days, 1),
    color: colors[index % colors.length],
  }));

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdayOccurrences = weekdayLabels.map(
    (_, weekday) =>
      Array.from(
        { length: days },
        (__, index) =>
          new Date(selectedStart.getTime() + index * dayMs).getUTCDay() ===
          weekday,
      ).filter(Boolean).length,
  );
  const weekdays = weekdayLabels.map((name, index) => {
    const row = weekdayRows.find((item) => item._id.day === index + 1);
    return {
      name,
      adr: row?.roomNights ? row.roomRevenue / row.roomNights : 0,
      revpar: row?.roomRevenue
        ? row.roomRevenue / Math.max(totalRooms * weekdayOccurrences[index], 1)
        : 0,
      occupancy: null,
    };
  });

  const nationalityTotal =
    nationalityRows.reduce((sum, row) => sum + row.count, 0) || 1;
  const cityTotal = cityRows.reduce((sum, row) => sum + row.count, 0) || 1;

  const paymentTotal =
    paymentRows.reduce((sum, row) => sum + Number(row.count || 0), 0) || 1;
  const revenueBreakdown = [
    { name: "Room Revenue", value: selectedRoomRevenue, color: colors[0] },
    {
      name: "Food & Beverage",
      value: selectedFoodBeverageRevenue,
      color: colors[1],
    },
    {
      name: "Other Services",
      value: selectedOtherServicesRevenue,
      color: colors[2],
    },
    {
      name: "Miscellaneous",
      value: selectedMiscellaneousRevenue,
      color: colors[3],
    },
  ];

  const paymentMethods = paymentRows.map((row, index) => ({
    name: row._id || "Unspecified",
    count: Number(row.count || 0),
    revenue: Number(row.amount || 0),
    value: (Number(row.count || 0) / paymentTotal) * 100,
    percentage: (Number(row.count || 0) / paymentTotal) * 100,
    color: colors[index % colors.length],
  }));

  const bookingLeadTime = bookingLeadRows.map((row) => ({
    name: row._id || "Unspecified",
    count: Number(row.count || 0),
  }));
  const bookingLeadTimeTotal =
    bookingLeadTime.reduce((sum, row) => sum + row.count, 0) || 1;
  const leadTime = bookingLeadTime.map((row) => ({
    ...row,
    value: (row.count / bookingLeadTimeTotal) * 100,
  }));

  const stayDurationTotal =
    stayDurationRows.reduce((sum, row) => sum + Number(row.count || 0), 0) || 1;
  const stayDuration = stayDurationRows.map((row) => ({
    name: row._id || "Unspecified",
    count: Number(row.count || 0),
    value: (Number(row.count || 0) / stayDurationTotal) * 100,
  }));

  const nationality = nationalityRows.map((row, index) => ({
    name: row._id || "Unspecified",
    count: Number(row.count || 0),
    value: (Number(row.count || 0) / nationalityTotal) * 100,
    color: colors[index % colors.length],
  }));
  const cities = cityRows.map((row, index) => ({
    name: row._id || "Unspecified",
    count: Number(row.count || 0),
    value: (Number(row.count || 0) / cityTotal) * 100,
    color: colors[index % colors.length],
  }));
  const purposeTotal =
    purposeRows.reduce((sum, row) => sum + Number(row.count || 0), 0) || 1;
  const purpose = purposeRows.map((row, index) => ({
    name: row._id || "Other",
    count: Number(row.count || 0),
    value: (Number(row.count || 0) / purposeTotal) * 100,
    color: colors[index % colors.length],
  }));
  const ageGroupTotal =
    guestAgeRows.reduce((sum, row) => sum + Number(row.count || 0), 0) || 1;
  const ageGroups = guestAgeRows.map((row) => ({
    name: row._id || "Unspecified",
    count: Number(row.count || 0),
    value: (Number(row.count || 0) / ageGroupTotal) * 100,
  }));

  const cancellationReasonRows = cancellationReasons.length
    ? cancellationReasons
    : reservationCancellationReasons;
  const cancellationReasonTotal =
    cancellationReasonRows.reduce(
      (sum, row) => sum + Number(row.count || 0),
      0,
    ) || 1;
  const reasons = cancellationReasonRows.map((row, index) => ({
    name: String(row._id || "Other").replaceAll("_", " "),
    count: Number(row.count || 0),
    value: (Number(row.count || 0) / cancellationReasonTotal) * 100,
    revenueLost: Number(row.revenueLost || 0),
    color: colors[index % colors.length],
  }));
  const cancellationDates = new Map(
    cancellationRows.map((row) => [dayKey(row._id.date), row]),
  );

  const heatmap = roomsByType.map((room, index) => {
    const rollupValues = occupiedByDate.get(room._id);
    const rawValues = rawHeatmapTotals.get(room._id) || Array(7).fill(0);
    const rawCounts = rawHeatmapCounts.get(room._id) || Array(7).fill(0);
    const values = (
      rollupValues ||
      rawValues.map((value, day) =>
        rawCounts[day] ? value / rawCounts[day] : 0,
      )
    ).map((value) => Math.round(value));
    return { name: room._id, values, color: colors[index % colors.length] };
  });

  const rateHeatmap = roomsByType.map((room, index) => {
    const values = Array(7).fill(0);
    for (const row of rateHeatmapData) {
      if (row._id.roomType === room._id)
        values[(row._id.day + 5) % 7] = row.roomNights
          ? Math.round(row.roomRevenue / row.roomNights)
          : 0;
    }
    return { name: room._id, values, color: colors[index % colors.length] };
  });

  for (const target of series) {
    const cancellation = cancellationDates.get(target.date);
    if (cancellation) {
      target.cancellations = cancellation.count;
      target.cancelled = cancellation.count;
      target.revenueLost = cancellation.amount;
      target.cancelledRoomNights = cancellation.roomNights;
      target.avgDaysBeforeCancel = cancellation.avgDaysBeforeCancel;
    }
    target.cancellationRate = target.bookings
      ? (target.cancellations / target.bookings) * 100
      : 0;
  }
  selectedCancellations = total(selected, "cancellations");

  const forecastValues = (metric) =>
    forecastRows
      .filter((row) => row._id.metric === metric)
      .map((row) => Number(row.value || 0));
  const forecastSum = (metric) =>
    forecastValues(metric).reduce((sum, value) => sum + value, 0);
  const forecastAverage = (metric) => {
    const values = forecastValues(metric);
    return values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;
  };
  const forecastMetricValue = (metric) =>
    forecastAverage(metric) === null ? "—" : money(forecastAverage(metric));

  const forecastSelectedMetrics = {
    "Forecasted Occupancy":
      forecastAverage("occupancy") === null
        ? "—"
        : `${forecastAverage("occupancy").toFixed(1)}%`,
    "Forecasted Revenue": forecastValues("revenue").length
      ? money(forecastSum("revenue"))
      : "—",
    "Forecasted ADR": forecastMetricValue("adr"),
    "Forecasted RevPAR":
      forecastAverage("adr") === null || forecastAverage("occupancy") === null
        ? "—"
        : money((forecastAverage("adr") * forecastAverage("occupancy")) / 100),
    "Expected Bookings": forecastValues("bookings").length
      ? Math.round(forecastSum("bookings")).toLocaleString("en-IN")
      : "—",
  };

  const selectedMetrics =
    {
      revenue: {
        "Total Revenue": money(selectedRevenue),
        "Room Revenue": money(selectedRoomRevenue),
        "Services Revenue": money(selectedServicesRevenue),
        "Average Daily Revenue": money(
          selectedRevenue / Math.max(selected.length, 1),
        ),
        "Revenue Growth": `${growth.toFixed(1)}%`,
      },
      occupancy: {
        "Current Occupancy": `${(selected.at(-1)?.occupancyPct || 0).toFixed(1)}%`,
        "Total Rooms": String(totalRooms),
        "Occupied Rooms": String(
          Math.round((avg("occupancyPct") * totalRooms) / 100),
        ),
        "Available Rooms": String(
          Math.max(
            totalRooms - Math.round((avg("occupancyPct") * totalRooms) / 100),
            0,
          ),
        ),
        "Average Occupancy (MTD)": `${avg("occupancyPct").toFixed(1)}%`,
        "Highest Occupancy Day": selected.length
          ? `${Math.max(...selected.map((row) => row.occupancyPct || 0)).toFixed(1)}% (${selected.reduce((best, row) => ((row.occupancyPct || 0) > (best.occupancyPct || 0) ? row : best), selected[0]).day})`
          : "—",
        "Lowest Occupancy Day": selected.length
          ? `${Math.min(...selected.map((row) => row.occupancyPct || 0)).toFixed(1)}% (${selected.reduce((best, row) => ((row.occupancyPct || 0) < (best.occupancyPct || 0) ? row : best), selected[0]).day})`
          : "—",
        "Room Nights Sold": Math.round(totalRoomNights).toLocaleString("en-IN"),
      },
      adr: {
        "Average Daily Rate": money(
          selectedRoomRevenue / Math.max(totalRoomNights, 1),
        ),
        "Room Revenue": money(selectedRoomRevenue),
        RevPAR: money(selectedRoomRevenue / Math.max(totalRooms * days, 1)),
        "ADR (Weekdays)": money(
          weekdays
            .filter((row) => !["Sat", "Sun"].includes(row.name) && row.adr)
            .reduce((sum, row) => sum + row.adr, 0) /
            Math.max(
              weekdays.filter(
                (row) => !["Sat", "Sun"].includes(row.name) && row.adr,
              ).length,
              1,
            ),
        ),
        "ADR (Weekends)": money(
          weekdays
            .filter((row) => ["Sat", "Sun"].includes(row.name) && row.adr)
            .reduce((sum, row) => sum + row.adr, 0) /
            Math.max(
              weekdays.filter(
                (row) => ["Sat", "Sun"].includes(row.name) && row.adr,
              ).length,
              1,
            ),
        ),
      },
      revpar: {
        RevPAR: money(selectedRoomRevenue / Math.max(totalRooms * days, 1)),
        ADR: money(selectedRoomRevenue / Math.max(totalRoomNights, 1)),
        "Occupancy Rate": `${avg("occupancyPct").toFixed(1)}%`,
        "Total Revenue": money(selectedRevenue),
        "Available Rooms": String(totalRooms),
      },
      bookings: {
        "Total Bookings": selectedBookings.toLocaleString("en-IN"),
        Confirmed: total(selected, "confirmed").toLocaleString("en-IN"),
        Pending: total(selected, "pending").toLocaleString("en-IN"),
        Cancelled: selectedCancellations.toLocaleString("en-IN"),
        "No-shows": total(selected, "noShows").toLocaleString("en-IN"),
      },
      guests: {
        "Total Guests": String(totalGuests),
        "New Guests": String(
          Math.max(totalGuests - Number(guestCohortRows[0]?.returning || 0), 0),
        ),
        "Returning Guests": String(guestCohortRows[0]?.returning || 0),
        "Average Guest Spend": money(
          selectedRevenue / Math.max(totalGuests, 1),
        ),
        "Average Length of Stay": totalGuests
          ? `${(totalRoomNights / totalGuests).toFixed(1)} nights`
          : "0 nights",
      },
      cancellations: {
        "Total Cancellations": selectedCancellations.toLocaleString("en-IN"),
        "Cancellation Rate": `${((selectedCancellations / Math.max(selectedBookings, 1)) * 100).toFixed(1)}%`,
        "Revenue Lost": money(total(selected, "revenueLost")),
        "Cancelled Room Nights": String(total(selected, "cancelledRoomNights")),
        "Avg. Days Before Cancel": selectedCancellations
          ? `${(selected.reduce((sum, row) => sum + row.avgDaysBeforeCancel * row.cancellations, 0) / selectedCancellations).toFixed(1)} days`
          : "—",
      },
      forecast: forecastSelectedMetrics,
    }[id] || {};

  const metricDelta = (current, prior) =>
    prior
      ? `${(((current - prior) / Math.abs(prior)) * 100).toFixed(1)}%`
      : "—";
  const changes = {
    "Total Revenue": metricDelta(selectedRevenue, previousRevenue),
    "Room Revenue": metricDelta(selectedRoomRevenue, total(previous, "room")),
    "Services Revenue": metricDelta(
      selectedServicesRevenue,
      total(previous, "services"),
    ),
    "Average Daily Revenue": metricDelta(
      selectedRevenue / Math.max(selected.length, 1),
      previousRevenue / Math.max(previous.length, 1),
    ),
    "Current Occupancy": metricDelta(
      avg("occupancyPct"),
      previous.length ? total(previous, "occupancyPct") / previous.length : 0,
    ),
    "Average Occupancy (MTD)": metricDelta(
      avg("occupancyPct"),
      previous.length ? total(previous, "occupancyPct") / previous.length : 0,
    ),
    "Average Daily Rate": metricDelta(
      selectedRoomRevenue / Math.max(totalRoomNights, 1),
      total(previous, "room") /
        Math.max(total(previous, "roomNights") || totalRoomNights, 1),
    ),
    ADR: metricDelta(
      selectedRoomRevenue / Math.max(totalRoomNights, 1),
      total(previous, "room") /
        Math.max(total(previous, "roomNights") || totalRoomNights, 1),
    ),
    RevPAR: metricDelta(
      selectedRoomRevenue / Math.max(totalRooms * days, 1),
      total(previous, "room") / Math.max(totalRooms * days, 1),
    ),
    "Occupancy Rate": metricDelta(
      avg("occupancyPct"),
      previous.length ? total(previous, "occupancyPct") / previous.length : 0,
    ),
    "Total Bookings": metricDelta(
      selectedBookings,
      total(previous, "bookings"),
    ),
    "Total Cancellations": metricDelta(
      selectedCancellations,
      total(previous, "cancellations"),
    ),
    "Cancellation Rate": metricDelta(
      selectedCancellations / Math.max(selectedBookings, 1),
      total(previous, "cancellations") /
        Math.max(total(previous, "bookings"), 1),
    ),
    "Revenue Lost": metricDelta(
      total(selected, "revenueLost"),
      total(previous, "revenueLost"),
    ),
  };

  const metrics =
    DASHBOARDS[id]?.metrics?.map((metric) => ({
      ...metric,
      value: selectedMetrics[metric.label] ?? "—",
      change: changes[metric.label] || "—",
    })) || [];

  const forecastMap = new Map(
    forecastRows.map((row) => [
      `${row._id.metric}:${dayKey(row._id.date)}`,
      row,
    ]),
  );
  const actuals = selected.slice(-15).map((row) => ({
    day: row.day,
    date: row.date,
    occupancy: row.occupancyPct,
    occupancyForecast: null,
    occupancyLower: null,
    occupancyUpper: null,
    occupancyRange: null,
    revenue: row.total,
    revenueForecast: null,
    revenueLower: null,
    revenueUpper: null,
    revenueRange: null,
    adr: row.adr,
    adrForecast: null,
    adrLower: null,
    adrUpper: null,
    revpar: row.revpar,
    revparForecast: null,
    revparLower: null,
    revparUpper: null,
    bookingsForecast: null,
  }));
  const projections = Array.from({ length: days }, (_, index) => {
    const date = new Date(end.getTime() + index * dayMs);
    const key = dayKey(date);
    const occupancy = forecastMap.get(`occupancy:${key}`);
    const revenue = forecastMap.get(`revenue:${key}`);
    const adr = forecastMap.get(`adr:${key}`);
    const revpar = forecastMap.get(`revpar:${key}`);
    const bookings = forecastMap.get(`bookings:${key}`);
    return {
      day: dateLabel(date),
      date: key,
      occupancy: null,
      occupancyForecast: occupancy?.value ?? null,
      occupancyLower: occupancy?.lower ?? null,
      occupancyUpper: occupancy?.upper ?? null,
      occupancyRange: occupancy ? occupancy.upper - occupancy.lower : null,
      revenue: null,
      revenueForecast: revenue?.value ?? null,
      revenueLower: revenue?.lower ?? null,
      revenueUpper: revenue?.upper ?? null,
      revenueRange: revenue ? revenue.upper - revenue.lower : null,
      adr: null,
      adrForecast: adr?.value ?? null,
      adrLower: adr?.lower ?? null,
      adrUpper: adr?.upper ?? null,
      revpar: null,
      revparForecast: revpar?.value ?? null,
      revparLower: revpar?.lower ?? null,
      revparUpper: revpar?.upper ?? null,
      bookingsForecast: bookings?.value ?? null,
      bookingsLower: bookings?.lower ?? null,
      bookingsUpper: bookings?.upper ?? null,
      modelVersion:
        occupancy?.modelVersion ||
        revenue?.modelVersion ||
        adr?.modelVersion ||
        revpar?.modelVersion ||
        null,
    };
  });

  const comparisonMetric =
    id === "adr"
      ? selectedRoomRevenue / Math.max(totalRoomNights, 1)
      : id === "revpar"
        ? selectedRoomRevenue / Math.max(totalRooms * days, 1)
        : id === "cancellations"
          ? (selectedCancellations / Math.max(selectedBookings, 1)) * 100
          : null;

  const forecastSeries = [...actuals, ...projections];
  const forecast7 = projections.slice(0, 7);
  const forecast30 = projections.slice(0, 30);

  const avgForecast = (rows, key) => {
    const values = rows.map((row) => Number(row[key])).filter(Number.isFinite);
    return values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;
  };
  const sumForecast = (rows, key) =>
    rows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);

  const selectedForecast = {
    occupancy: avgForecast(projections, "occupancyForecast"),
    revenue: sumForecast(projections, "revenueForecast"),
    adr: avgForecast(projections, "adrForecast"),
    revpar: avgForecast(projections, "revparForecast"),
    bookings: sumForecast(projections, "bookingsForecast"),
  };

  const previousRoomRevenue = total(previous, "room");
  const previousRoomNights = total(previous, "roomNights");
  const currentAdr = selectedRoomRevenue / Math.max(totalRoomNights, 1);
  const previousAdr = previousRoomRevenue / Math.max(previousRoomNights, 1);
  const currentRevpar = selectedRoomRevenue / Math.max(totalRooms * days, 1);
  const previousRevpar = previousRoomRevenue / Math.max(totalRooms * days, 1);

  const comparison = {
    revenue: [
      {
        name: "This period",
        value: money(selectedRevenue),
        change: `${growth.toFixed(1)}%`,
      },
      {
        name: "Previous period",
        value: money(previousRevenue),
        change: previousRevenue
          ? `${(((selectedRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)}%`
          : "—",
      },
      { name: "Same period last year", value: "—", change: "not available" },
    ],
    adr: [
      {
        name: "This period",
        value: money(currentAdr),
        change: `${metricDelta(currentAdr, previousAdr)}`,
      },
      {
        name: "Previous period",
        value: money(previousAdr),
        change: previousAdr ? "baseline" : "—",
      },
      { name: "Same period last year", value: "—", change: "not available" },
    ],
    revpar: [
      {
        name: "This period",
        value: money(currentRevpar),
        change: `${metricDelta(currentRevpar, previousRevpar)}`,
      },
      {
        name: "Previous period",
        value: money(previousRevpar),
        change: previousRevpar ? "baseline" : "—",
      },
      { name: "Same period last year", value: "—", change: "not available" },
    ],
    cancellations: [
      {
        name: "This period",
        value: `${((selectedCancellations / Math.max(selectedBookings, 1)) * 100).toFixed(1)}%`,
        change: changes["Cancellation Rate"] || "—",
      },
      {
        name: "Previous period",
        value: `${((total(previous, "cancellations") / Math.max(total(previous, "bookings"), 1)) * 100).toFixed(1)}%`,
        change: "baseline",
      },
      { name: "Same period last year", value: "—", change: "not available" },
    ],
  };

  const dataQuality = {
    rollups: rollups.length,
    invoices: invoiceDays.length,
    occupancyRows: occupancyRows.length,
    adrRows: adrRows.length,
    reservations: selectedBookings,
    forecastDays: projections.filter(
      (row) =>
        Number.isFinite(row.occupancyForecast) ||
        Number.isFinite(row.revenueForecast) ||
        Number.isFinite(row.adrForecast) ||
        Number.isFinite(row.revparForecast),
    ).length,
  };

  const cancellationSources = cancellationSourceRows.map((row, index) => ({
    name: row._id || "Unspecified",
    count: Number(row.count || 0),
    value: (Number(row.count || 0) / Math.max(selectedCancellations, 1)) * 100,
    color: colors[index % colors.length],
  }));

  const cancellationLeadTime = cancellationLeadRows.map((row) => ({
    name: row._id || "Unspecified",
    count: Number(row.count || 0),
    value: (Number(row.count || 0) / Math.max(selectedCancellations, 1)) * 100,
  }));

  const cancellationTrend = selected.map((row) => ({
    day: row.day,
    date: row.date,
    cancellations: row.cancellations,
    cancellationRate: row.cancellationRate,
    revenueLost: row.revenueLost,
  }));

  const repeatAnalysis = {
    returningRate: totalGuests ? (returningGuestCount / totalGuests) * 100 : 0,
    averageBookings: Number(guestCohortRows[0]?.averageBookings || 0),
    averageSpend: money(
      totalGuests ? selectedRevenue / Math.max(returningGuestCount, 1) : 0,
    ),
    returnWithinSixMonths: null,
  };

  const dashboardDefinition = DASHBOARDS[id] || {};

  return {
    id,
    range,
    hotelId,
    title: dashboardDefinition.title || id,
    subtitle: dashboardDefinition.subtitle || "",
    generatedAt: new Date().toISOString(),
    source,
    metrics,
    series: selected,
    previousSeries: previous,
    roomTypes,
    sources,
    weekdays,
    heatmap,
    rateHeatmap,
    revparHeatmap: heatmap,
    revenueBreakdown,
    paymentMethods,
    leadTime,
    stayDuration,
    nationality,
    cities,
    ageGroups,
    purpose,
    guestMix: [
      {
        name: "New guests",
        value: totalGuests ? (newGuestCount / totalGuests) * 100 : 0,
        count: newGuestCount,
        color: colors[0],
      },
      {
        name: "Returning guests",
        value: totalGuests ? (returningGuestCount / totalGuests) * 100 : 0,
        count: returningGuestCount,
        color: colors[1],
      },
    ],
    repeatAnalysis,
    reasons,
    cancellationSources,
    cancellationLeadTime,
    cancellationTrend,
    forecast: forecastSeries,
    selectedForecast: forecast7,
    nextWeek: forecast7.map((row) => ({
      date: row.date,
      occupancy: row.occupancyForecast,
      adr: row.adrForecast,
      revpar: row.revparForecast,
      bookings: row.bookingsForecast,
      revenue: row.revenueForecast,
    })),
    forecastSummary: {
      revenue7: forecast7.some((row) => Number.isFinite(row.revenueForecast))
        ? {
            lower: sumForecast(forecast7, "revenueLower"),
            upper: sumForecast(forecast7, "revenueUpper"),
          }
        : null,
      revenue30: forecast30.some((row) => Number.isFinite(row.revenueForecast))
        ? {
            lower: sumForecast(forecast30, "revenueLower"),
            upper: sumForecast(forecast30, "revenueUpper"),
          }
        : null,
      adr7: avgForecast(forecast7, "adrForecast"),
      adr30: avgForecast(forecast30, "adrForecast"),
      bookings7: sumForecast(forecast7, "bookingsForecast"),
      bookings30: sumForecast(forecast30, "bookingsForecast"),
    },
    comparisonMetric,
    comparison: comparison[id] || comparison.revenue,
    forecastComparison: [
      {
        name: "Occupancy",
        value:
          selectedForecast.occupancy === null
            ? "—"
            : `${selectedForecast.occupancy.toFixed(1)}%`,
        change: "forecast",
      },
      {
        name: "ADR",
        value:
          selectedForecast.adr === null ? "—" : money(selectedForecast.adr),
        change: "forecast",
      },
      {
        name: "RevPAR",
        value:
          selectedForecast.revpar === null
            ? "—"
            : money(selectedForecast.revpar),
        change: "forecast",
      },
      {
        name: "Revenue",
        value: selectedForecast.revenue ? money(selectedForecast.revenue) : "—",
        change: "forecast",
      },
      {
        name: "Bookings",
        value: selectedForecast.bookings
          ? Math.round(selectedForecast.bookings).toLocaleString("en-IN")
          : "—",
        change: "forecast",
      },
    ],
    summary: {
      totalRevenue: selectedRevenue,
      roomRevenue: selectedRoomRevenue,
      servicesRevenue: selectedServicesRevenue,
      averageDailyRevenue: selectedRevenue / Math.max(selected.length, 1),
      revenueGrowthPct: growth,
      occupancyPct: avg("occupancyPct"),
      adr: currentAdr,
      revpar: currentRevpar,
      bookings: selectedBookings,
      cancellations: selectedCancellations,
      guests: totalGuests,
    },
    dataQuality,
    guestDemographics: {
      totalGuests,
      nationalityTotal,
      cityTotal,
      newGuestCount,
      returningGuestCount,
      reservationCount,
    },
  };
}
