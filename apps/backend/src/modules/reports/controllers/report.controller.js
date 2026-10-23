import Room from "#/modules/rooms/models/Room.js";
import Booking from "#/modules/bookings/models/Booking.js";
import ServiceRequest from "#/modules/service-requests/models/ServiceRequest.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import Bill from "#/modules/billing/models/Bill.js";
import Payment from "#/modules/billing/models/Payment.js";
import logger from "#/utils/logger.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const amountOf = (bill) => Math.max(0, Number(bill.totalAmount) || 0);

const isLinkedOrderBill = (bill) =>
  Array.isArray(bill.linkedOrderIds) && bill.linkedOrderIds.length > 0;

/**
 * Format a date using UTC calendar fields.
 */
const formatDate = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Generate dates between start (inclusive) and end (exclusive).
 */
const dateRange = (start, end) => {
  const dates = [];
  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const exclusiveEnd = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
  );

  const dayCount = Math.max(0, (exclusiveEnd - cursor) / DAY_MS);

  for (let index = 0; index < dayCount; index += 1) {
    const date = new Date(cursor);
    date.setUTCDate(date.getUTCDate() + index);
    dates.push(date);
  }

  return dates;
};

/**
 * Parse report periods using UTC calendar-day boundaries, matching inventory dates.
 *
 * The internal end date is exclusive.
 * Custom endDate is inclusive for the user.
 */
const parseDateRange = (query) => {
  const { period, startDate, endDate } = query;
  const now = new Date();

  if (
    period !== undefined &&
    !["today", "week", "month", "custom"].includes(period)
  ) {
    throw new Error("Invalid report period");
  }

  let start;
  let end;

  if (period === "today") {
    start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
  } else if (period === "week") {
    end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
    );
    start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 7);
  } else if (period === "month") {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  } else if (period === "custom") {
    if (!startDate || !endDate) {
      throw new Error("Custom date range requires startDate and endDate");
    }

    const startInput = new Date(`${startDate}T00:00:00.000Z`);
    const endInput = new Date(`${endDate}T00:00:00.000Z`);

    if (
      Number.isNaN(startInput.getTime()) ||
      Number.isNaN(endInput.getTime()) ||
      formatDate(startInput) !== startDate ||
      formatDate(endInput) !== endDate ||
      startInput > endInput
    ) {
      throw new Error("Invalid custom date range");
    }

    start = startInput;
    end = new Date(endInput);
    end.setUTCDate(end.getUTCDate() + 1);
  } else {
    start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
  }

  return { start, end };
};

/**
 * Get current room inventory and status metrics.
 */
const getRoomMetrics = async (hotelId) => {
  const roomStatusCounts = await Room.aggregate([
    { $match: { hotelId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const statusCount = (status) =>
    roomStatusCounts.find((room) => room._id === status)?.count || 0;

  const totalRooms = roomStatusCounts.reduce(
    (sum, room) => sum + room.count,
    0,
  );

  const occupiedRooms = statusCount("occupied");
  const availableRooms = statusCount("available");
  const reservedRooms = statusCount("reserved");
  const cleaningRooms = statusCount("cleaning");

  const roomTypeBreakdown = await Room.aggregate([
    { $match: { hotelId } },
    {
      $group: {
        _id: "$type",
        total: { $sum: 1 },
        occupied: {
          $sum: { $cond: [{ $eq: ["$status", "occupied"] }, 1, 0] },
        },
        available: {
          $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] },
        },
        reserved: {
          $sum: { $cond: [{ $eq: ["$status", "reserved"] }, 1, 0] },
        },
        cleaning: {
          $sum: { $cond: [{ $eq: ["$status", "cleaning"] }, 1, 0] },
        },
        avgRate: { $avg: "$rate" },
        totalRate: { $sum: "$rate" },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const floorBreakdown = await Room.aggregate([
    { $match: { hotelId } },
    {
      $group: {
        _id: "$floor",
        total: { $sum: 1 },
        occupied: {
          $sum: { $cond: [{ $eq: ["$status", "occupied"] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    total: totalRooms,
    occupied: occupiedRooms,
    available: availableRooms,
    reserved: reservedRooms,
    cleaning: cleaningRooms,
    occupancyRate:
      totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
    byType: roomTypeBreakdown.map((roomType) => ({
      type: roomType._id,
      total: roomType.total,
      occupied: roomType.occupied,
      available: roomType.available,
      reserved: roomType.reserved,
      cleaning: roomType.cleaning,
      avgRate: Math.round(roomType.avgRate || 0),

      // This is the sum of current room rates, not historical revenue.
      currentRateTotal: roomType.totalRate || 0,
      revenue: roomType.totalRate || 0,

      occupancyRate:
        roomType.total > 0
          ? Math.round((roomType.occupied / roomType.total) * 100)
          : 0,
    })),
    byFloor: floorBreakdown.map((floor) => ({
      floor: floor._id,
      total: floor.total,
      occupied: floor.occupied,
      occupancyRate:
        floor.total > 0 ? Math.round((floor.occupied / floor.total) * 100) : 0,
    })),
  };
};

/**
 * Get booking and guest metrics for the selected period.
 */
const getBookingMetrics = async (hotelId, startDate, endDate) => {
  const [
    checkedInBookings,
    arrivalBookings,
    departureBookings,
    totalBookings,
    bookingsInPeriod,
  ] = await Promise.all([
    Booking.find({ hotelId, status: "checked-in" })
      .select("guestId")
      .populate({ path: "guestId", match: { hotelId }, select: "name" })
      .lean(),

    Booking.find({
      hotelId,
      status: { $in: ["confirmed", "reserved"] },
      checkIn: { $gte: startDate, $lt: endDate },
    })
      .select("guestId")
      .populate({ path: "guestId", match: { hotelId }, select: "name" })
      .lean(),

    Booking.find({
      hotelId,
      status: "checked-in",
      checkOut: { $gte: startDate, $lt: endDate },
    })
      .select("guestId")
      .populate({ path: "guestId", match: { hotelId }, select: "name" })
      .lean(),

    Booking.countDocuments({ hotelId }),

    Booking.find({
      hotelId,
      createdAt: { $gte: startDate, $lt: endDate },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "roomId",
        match: { hotelId },
        select: "roomNumber type rate",
      })
      .populate({ path: "guestId", match: { hotelId }, select: "name" }),
  ]);

  const completedStays = await Booking.aggregate([
    {
      $match: {
        hotelId,
        status: "checked-out",
        checkIn: { $exists: true, $ne: null },
        checkOut: { $exists: true, $ne: null },
        updatedAt: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $project: {
        duration: {
          $divide: [{ $subtract: ["$checkOut", "$checkIn"] }, DAY_MS],
        },
      },
    },
    { $group: { _id: null, avgDuration: { $avg: "$duration" } } },
  ]);

  const bookingSources = await Booking.aggregate([
    {
      $match: {
        hotelId,
        createdAt: { $gte: startDate, $lt: endDate },
      },
    },
    { $group: { _id: "$source", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const avgStayDuration =
    completedStays[0]?.avgDuration != null
      ? Math.round(completedStays[0].avgDuration * 10) / 10
      : 0;
  const checkedInGuests = checkedInBookings.map((booking) => ({
    name: booking.guestId?.name || "Unknown",
  }));
  const arrivalGuests = arrivalBookings.map((booking) => ({
    name: booking.guestId?.name || "Unknown",
  }));
  const departureGuests = departureBookings.map((booking) => ({
    name: booking.guestId?.name || "Unknown",
  }));

  return {
    checkedIn: checkedInBookings.length,
    checkedInGuests,
    arrivalsToday: arrivalBookings.length,
    arrivals: arrivalBookings.length,
    arrivalGuests,
    reservedGuests: arrivalGuests,
    departuresToday: departureBookings.length,
    departures: departureBookings.length,
    departureGuests,
    checkedOutGuests: departureGuests,
    totalBookings,
    bookingsInPeriod: bookingsInPeriod.length,
    avgStayDuration,
    bookingSources: bookingSources.map((source) => ({
      source: source._id || "DIRECT",
      count: source.count,
    })),
    recentBookings: bookingsInPeriod.slice(0, 10).map((booking) => ({
      id: booking._id,
      guestName: booking.guestId?.name || "Unknown",
      roomNumber: booking.roomId?.roomNumber || "N/A",
      roomType: booking.roomId?.type || "N/A",
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      status: booking.status,
      channel: booking.channel || "DIRECT",
      createdAt: booking.createdAt,
    })),
  };
};

/**
 * Get revenue metrics.
 *
 * Billed revenue is based on finalized bills created in the selected period.
 * Collected revenue is based on successful payment records in that period.
 * Linked food orders are counted through bills, avoiding double counting.
 */
const getRevenueMetrics = async (hotelId, startDate, endDate) => {
  const billMatch = {
    hotelId,
    status: { $in: ["saved", "paid"] },
    createdAt: { $gte: startDate, $lt: endDate },
  };

  const [bills, paymentTotals, totalRooms, bookings] = await Promise.all([
    Bill.find(billMatch)
      .select(
        "billType roomId bookingId linkedOrderIds items totalAmount createdAt",
      )
      .lean(),

    Payment.aggregate([
      {
        $match: {
          hotelId,
          status: "success",
          businessDate: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]),

    Room.countDocuments({ hotelId }),

    Booking.find({
      hotelId,
      status: { $in: ["checked-in", "checked-out"] },
      checkIn: { $lt: endDate },
      checkOut: { $gt: startDate },
    })
      .select("checkIn checkOut roomId")
      .lean(),
  ]);

  const isFoodBill = (bill) =>
    isLinkedOrderBill(bill) ||
    ["dine-in", "takeaway", "delivery"].includes(bill.billType);

  const roomBills = bills.filter(
    (bill) => bill.billType === "room-charge" && !isLinkedOrderBill(bill),
  );

  const foodBills = bills.filter(isFoodBill);

  const roomRevenue = roomBills.reduce(
    (total, bill) => total + amountOf(bill),
    0,
  );

  const foodRevenue = foodBills.reduce(
    (total, bill) => total + amountOf(bill),
    0,
  );

  const totalRevenue = roomRevenue + foodRevenue;
  const collectedRevenue = Number(paymentTotals[0]?.total || 0);

  const foodOrderIds = new Set(
    foodBills
      .flatMap((bill) => bill.linkedOrderIds || [])
      .map((orderId) => orderId.toString()),
  );
  const foodOrderCount = foodOrderIds.size;
  const linkedFoodRevenue = foodBills
    .filter(isLinkedOrderBill)
    .reduce((total, bill) => total + amountOf(bill), 0);

  const avgOrderValue =
    foodOrderCount > 0 ? Math.round(linkedFoodRevenue / foodOrderCount) : 0;

  // Only assigned room IDs can be counted as physical room-nights.
  const days = dateRange(startDate, endDate);
  const occupiedRoomsByDate = new Map(
    days.map((day) => [formatDate(day), new Set()]),
  );

  for (const booking of bookings) {
    if (!booking.checkIn || !booking.checkOut || !booking.roomId) continue;

    for (const day of days) {
      const nextDay = new Date(day);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      if (
        new Date(booking.checkIn) < nextDay &&
        new Date(booking.checkOut) > day
      ) {
        occupiedRoomsByDate
          .get(formatDate(day))
          ?.add(booking.roomId.toString());
      }
    }
  }

  const occupiedRoomNights = [...occupiedRoomsByDate.values()].reduce(
    (total, occupiedRooms) => total + occupiedRooms.size,
    0,
  );
  const availableRoomNights = totalRooms * days.length;

  const avgDailyRate =
    occupiedRoomNights > 0 ? Math.round(roomRevenue / occupiedRoomNights) : 0;

  const revPAR =
    availableRoomNights > 0 ? Math.round(roomRevenue / availableRoomNights) : 0;

  const roomIds = [
    ...new Set(
      roomBills.map((bill) => bill.roomId?.toString()).filter(Boolean),
    ),
  ];

  const rooms = roomIds.length
    ? await Room.find({ _id: { $in: roomIds }, hotelId })
        .select("_id type")
        .lean()
    : [];

  const roomTypes = new Map(
    rooms.map((room) => [room._id.toString(), room.type || "Unknown"]),
  );

  const revenueByTypeMap = new Map();

  for (const bill of roomBills) {
    const type = roomTypes.get(bill.roomId?.toString()) || "Unknown";
    const current = revenueByTypeMap.get(type) || {
      revenue: 0,
      count: 0,
    };

    current.revenue += amountOf(bill);
    current.count += 1;
    revenueByTypeMap.set(type, current);
  }

  const revenueByType = [...revenueByTypeMap.entries()]
    .map(([type, totals]) => ({
      type,
      revenue: totals.revenue,
      count: totals.count,
      avgRate: totals.count > 0 ? Math.round(totals.revenue / totals.count) : 0,
    }))
    .toSorted((a, b) => b.revenue - a.revenue);

  const foodBillMatch = {
    ...billMatch,
    $or: [
      { linkedOrderIds: { $exists: true, $ne: [] } },
      { billType: { $in: ["dine-in", "takeaway", "delivery"] } },
    ],
  };

  const dailyRevenue = await Bill.aggregate([
    { $match: foodBillMatch },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
            timezone: "UTC",
          },
        },
        revenue: { $sum: "$totalAmount" },
        orders: { $addToSet: { $ifNull: ["$linkedOrderIds", []] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dailyRoomRevenue = await Bill.aggregate([
    {
      $match: {
        ...billMatch,
        billType: "room-charge",
        $or: [
          { linkedOrderIds: { $exists: false } },
          { linkedOrderIds: { $size: 0 } },
        ],
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
            timezone: "UTC",
          },
        },
        revenue: { $sum: "$totalAmount" },
        rooms: { $addToSet: "$roomId" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const topFoodItems = await Bill.aggregate([
    { $match: foodBillMatch },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        quantity: { $sum: "$items.quantity" },
        revenue: {
          $sum: {
            $multiply: [
              { $ifNull: ["$items.price", 0] },
              { $ifNull: ["$items.quantity", 1] },
            ],
          },
        },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ]);

  return {
    roomRevenue,
    foodRevenue,
    totalRevenue,
    collectedRevenue,
    avgDailyRate,
    revPAR,
    foodOrderCount,
    avgOrderValue,
    revenueByType,
    dailyRevenue: dailyRevenue.map((day) => ({
      date: day._id,
      revenue: day.revenue,
      orders: new Set(
        (day.orders || [])
          .flat()
          .filter(Boolean)
          .map((orderId) => orderId.toString()),
      ).size,
    })),
    dailyRoomRevenue: dailyRoomRevenue.map((day) => ({
      date: day._id,
      revenue: day.revenue,
      rooms: new Set(
        (day.rooms || []).filter(Boolean).map((roomId) => roomId.toString()),
      ).size,
    })),
    topFoodItems: topFoodItems.map((item) => ({
      name: item._id,
      quantity: item.quantity,
      revenue: item.revenue,
    })),
  };
};

/**
 * Get service request metrics.
 */
const getServiceRequestMetrics = async (hotelId, startDate, endDate) => {
  const [statusCounts, typeCounts, priorityCounts, avgResponseTime] =
    await Promise.all([
      ServiceRequest.aggregate([
        {
          $match: {
            hotelId,
            createdAt: { $gte: startDate, $lt: endDate },
          },
        },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      ServiceRequest.aggregate([
        {
          $match: {
            hotelId,
            createdAt: { $gte: startDate, $lt: endDate },
          },
        },
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      ServiceRequest.aggregate([
        {
          $match: {
            hotelId,
            createdAt: { $gte: startDate, $lt: endDate },
          },
        },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),

      ServiceRequest.aggregate([
        {
          $match: {
            hotelId,
            status: "COMPLETED",
            createdAt: { $gte: startDate, $lt: endDate },
            updatedAt: { $exists: true },
          },
        },
        {
          $project: {
            responseTime: {
              $divide: [{ $subtract: ["$updatedAt", "$createdAt"] }, 1000 * 60],
            },
          },
        },
        { $group: { _id: null, avgMinutes: { $avg: "$responseTime" } } },
      ]),
    ]);

  const totalRequests = statusCounts.reduce(
    (sum, status) => sum + status.count,
    0,
  );
  const avgCompletionTimeMinutes =
    avgResponseTime[0]?.avgMinutes != null
      ? Math.round(avgResponseTime[0].avgMinutes * 10) / 10
      : 0;

  return {
    totalRequests,
    byStatus: statusCounts.map((status) => ({
      status: status._id,
      count: status.count,
    })),
    byType: typeCounts.map((type) => ({
      type: type._id,
      count: type.count,
    })),
    byPriority: priorityCounts.map((priority) => ({
      priority: priority._id,
      count: priority.count,
    })),
    avgCompletionTimeMinutes,
    avgResponseTimeMinutes: avgCompletionTimeMinutes,
  };
};

/**
 * Get occupancy trend using distinct room IDs per day.
 * Multi-room bookings have only one persisted roomId, so unassigned units cannot be inferred.
 */
const getOccupancyTrend = async (hotelId, startDate, endDate) => {
  const [bookings, totalRooms] = await Promise.all([
    Booking.find({
      hotelId,
      status: { $in: ["checked-in", "checked-out"] },
      checkIn: { $lt: endDate },
      checkOut: { $gt: startDate },
    })
      .select("_id roomId checkIn checkOut")
      .lean(),

    Room.countDocuments({ hotelId }),
  ]);

  const days = dateRange(startDate, endDate);
  const dailyOccupancy = new Map();

  for (const day of days) {
    dailyOccupancy.set(formatDate(day), new Set());
  }

  for (const booking of bookings) {
    if (!booking.checkIn || !booking.checkOut || !booking.roomId) continue;

    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const roomKey = booking.roomId.toString();

    for (const day of days) {
      const nextDay = new Date(day);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      if (checkIn < nextDay && checkOut > day) {
        dailyOccupancy.get(formatDate(day))?.add(roomKey);
      }
    }
  }

  return [...dailyOccupancy.entries()].map(([date, occupiedRooms]) => ({
    date,
    occupied: occupiedRooms.size,
    total: totalRooms,
    occupancyRate:
      totalRooms > 0 ? Math.round((occupiedRooms.size / totalRooms) * 100) : 0,
  }));
};

/**
 * Main endpoint for the authenticated hotel's report.
 */
export const getReportData = async (req, res) => {
  try {
    const hotelId = req.user?.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "You are not assigned to a hotel",
      });
    }

    const { start, end } = parseDateRange(req.query);

    const hotel = await Hotel.findById(hotelId).select("name");

    const [
      roomMetrics,
      bookingMetrics,
      revenueMetrics,
      serviceMetrics,
      occupancyTrend,
    ] = await Promise.all([
      getRoomMetrics(hotelId),
      getBookingMetrics(hotelId, start, end),
      getRevenueMetrics(hotelId, start, end),
      getServiceRequestMetrics(hotelId, start, end),
      getOccupancyTrend(hotelId, start, end),
    ]);

    const inclusiveEnd = new Date(end);
    inclusiveEnd.setUTCDate(inclusiveEnd.getUTCDate() - 1);

    return res.status(200).json({
      success: true,
      message: "Report data fetched successfully",
      data: {
        hotelName: hotel?.name || "",
        period: {
          start: formatDate(start),
          end: formatDate(inclusiveEnd),
        },
        rooms: roomMetrics,
        bookings: bookingMetrics,
        revenue: revenueMetrics,
        serviceRequests: serviceMetrics,
        occupancyTrend,
      },
    });
  } catch (error) {
    logger.error(error, "Get report data error");

    const isValidationError =
      error.message === "Invalid report period" ||
      error.message === "Invalid custom date range" ||
      error.message === "Custom date range requires startDate and endDate";

    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: isValidationError
        ? error.message
        : "Failed to fetch report data",
    });
  }
};
