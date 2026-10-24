import Room from "#/modules/rooms/models/Room.js";
import Booking from "#/modules/bookings/models/Booking.js";
import Order from "#/modules/orders/models/Order.js";
import ServiceRequest from "#/modules/service-requests/models/ServiceRequest.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import logger from "#/utils/logger.js";

/**
 * Generate an array of dates between start (inclusive) and end (exclusive)
 */
const dateRange = (start, end) => {
  const dates = [];
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  for (let i = 0; i < diffDays; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  return dates;
};

/**
 * Parse date range from query params
 * Supports: today, week, month, custom (startDate, endDate)
 */
const parseDateRange = (query) => {
  const { period, startDate, endDate } = query;
  const now = new Date();
  let start, end;

  if (period === "today") {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(end.getDate() + 1);
  } else if (period === "week") {
    start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (period === "custom" && startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else {
    // Default to today
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
};

/**
 * Get room metrics with occupancy by type and status
 */
const getRoomMetrics = async (hotelId, _startDate, _endDate) => {
  // Current room status counts
  const roomStatusCounts = await Room.aggregate([
    { $match: { hotelId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const statusCount = (status) =>
    roomStatusCounts.find((r) => r._id === status)?.count || 0;

  const totalRooms = roomStatusCounts.reduce((sum, r) => sum + r.count, 0);
  const occupiedRooms = statusCount("occupied");
  const availableRooms = statusCount("available");
  const reservedRooms = statusCount("reserved");
  const cleaningRooms = statusCount("cleaning");

  // Room type breakdown
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

  // Floor breakdown
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

  const occupancyRate =
    totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  return {
    total: totalRooms,
    occupied: occupiedRooms,
    available: availableRooms,
    reserved: reservedRooms,
    cleaning: cleaningRooms,
    occupancyRate,
    byType: roomTypeBreakdown.map((t) => ({
      type: t._id,
      total: t.total,
      occupied: t.occupied,
      available: t.available,
      reserved: t.reserved,
      cleaning: t.cleaning,
      avgRate: Math.round(t.avgRate || 0),
      revenue: t.totalRate,
      occupancyRate: t.total > 0 ? Math.round((t.occupied / t.total) * 100) : 0,
    })),
    byFloor: floorBreakdown.map((f) => ({
      floor: f._id,
      total: f.total,
      occupied: f.occupied,
      occupancyRate: f.total > 0 ? Math.round((f.occupied / f.total) * 100) : 0,
    })),
  };
};

/**
 * Get booking/guest metrics
 */
const getBookingMetrics = async (hotelId, startDate, endDate) => {
  const [
    checkedIn,
    arrivalsToday,
    departuresToday,
    totalBookings,
    bookingsInPeriod,
  ] = await Promise.all([
    Booking.countDocuments({ hotelId, status: "checked-in" }),
    Booking.countDocuments({
      hotelId,
      checkIn: { $gte: startDate, $lt: endDate },
    }),
    Booking.countDocuments({
      hotelId,
      checkOut: { $gte: startDate, $lt: endDate },
      status: { $ne: "checked-out" },
    }),
    Booking.countDocuments({ hotelId }),
    Booking.find({ hotelId, createdAt: { $gte: startDate, $lt: endDate } })
      .populate("roomId", "roomNumber type rate")
      .populate("guestId", "name"),
  ]);

  // Average stay duration
  const completedStays = await Booking.aggregate([
    {
      $match: {
        hotelId,
        status: "checked-out",
        checkIn: { $exists: true },
        checkOut: { $exists: true },
        updatedAt: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $project: {
        duration: {
          $divide: [
            { $subtract: ["$checkOut", "$checkIn"] },
            1000 * 60 * 60 * 24,
          ],
        },
      },
    },
    { $group: { _id: null, avgDuration: { $avg: "$duration" } } },
  ]);

  // Booking sources
  const bookingSources = await Booking.aggregate([
    { $match: { hotelId, createdAt: { $gte: startDate, $lt: endDate } } },
    { $group: { _id: "$channel", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const avgStayDuration = completedStays[0]?.avgDuration
    ? Math.round(completedStays[0].avgDuration * 10) / 10
    : 0;

  return {
    checkedIn,
    arrivalsToday,
    departuresToday,
    totalBookings,
    bookingsInPeriod: bookingsInPeriod.length,
    avgStayDuration,
    bookingSources: bookingSources.map((s) => ({
      source: s._id || "DIRECT",
      count: s.count,
    })),
    recentBookings: bookingsInPeriod.slice(0, 10).map((b) => ({
      id: b._id,
      guestName: b.guestId?.name || "Unknown",
      roomNumber: b.roomId?.roomNumber || "N/A",
      roomType: b.roomId?.type || "N/A",
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      status: b.status,
      channel: b.channel,
      createdAt: b.createdAt,
    })),
  };
};

/**
 * Get revenue metrics
 */
const getRevenueMetrics = async (hotelId, startDate, endDate) => {
  // Room revenue from occupied rooms
  const occupiedRooms = await Room.find({ hotelId, status: "occupied" }).select(
    "rate type",
  );
  const roomRevenue = occupiedRooms.reduce((sum, r) => sum + (r.rate || 0), 0);
  const avgDailyRate =
    occupiedRooms.length > 0
      ? Math.round(roomRevenue / occupiedRooms.length)
      : 0;

  // Revenue by room type
  const revenueByType = await Room.aggregate([
    { $match: { hotelId, status: "occupied" } },
    {
      $group: {
        _id: "$type",
        revenue: { $sum: "$rate" },
        count: { $sum: 1 },
        avgRate: { $avg: "$rate" },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  // F&B revenue from delivered orders in period
  const foodRevenueAgg = await Order.aggregate([
    {
      $match: {
        hotelId,
        status: "DELIVERED",
        createdAt: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalAmount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const foodRevenue = foodRevenueAgg[0]?.total || 0;
  const foodOrderCount = foodRevenueAgg[0]?.count || 0;
  const avgOrderValue =
    foodOrderCount > 0 ? Math.round(foodRevenue / foodOrderCount) : 0;

  // Daily revenue trend for the period
  const dailyRevenue = await Order.aggregate([
    {
      $match: {
        hotelId,
        status: "DELIVERED",
        createdAt: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Room revenue daily trend (using booking check-in dates)
  const dailyRoomRevenue = await Booking.aggregate([
    {
      $match: {
        hotelId,
        status: "checked-in",
        checkIn: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $lookup: {
        from: "rooms",
        localField: "roomId",
        foreignField: "_id",
        as: "room",
      },
    },
    { $unwind: "$room" },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$checkIn" } },
        revenue: { $sum: "$room.rate" },
        rooms: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Top food items
  const topFoodItems = await Order.aggregate([
    {
      $match: {
        hotelId,
        status: "DELIVERED",
        createdAt: { $gte: startDate, $lt: endDate },
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        quantity: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ]);

  const totalRevenue = roomRevenue + foodRevenue;
  const revPAR =
    occupiedRooms.length > 0
      ? Math.round(totalRevenue / occupiedRooms.length)
      : 0;

  return {
    roomRevenue,
    foodRevenue,
    totalRevenue,
    avgDailyRate,
    revPAR,
    foodOrderCount,
    avgOrderValue,
    revenueByType: revenueByType.map((r) => ({
      type: r._id,
      revenue: r.revenue,
      count: r.count,
      avgRate: Math.round(r.avgRate || 0),
    })),
    dailyRevenue: dailyRevenue.map((d) => ({
      date: d._id,
      revenue: d.revenue,
      orders: d.orders,
    })),
    dailyRoomRevenue: dailyRoomRevenue.map((d) => ({
      date: d._id,
      revenue: d.revenue,
      rooms: d.rooms,
    })),
    topFoodItems: topFoodItems.map((i) => ({
      name: i._id,
      quantity: i.quantity,
      revenue: i.revenue,
    })),
  };
};

/**
 * Get service request metrics
 */
const getServiceRequestMetrics = async (hotelId, startDate, endDate) => {
  const [statusCounts, typeCounts, priorityCounts, avgResponseTime] =
    await Promise.all([
      ServiceRequest.aggregate([
        { $match: { hotelId, createdAt: { $gte: startDate, $lt: endDate } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      ServiceRequest.aggregate([
        { $match: { hotelId, createdAt: { $gte: startDate, $lt: endDate } } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ServiceRequest.aggregate([
        { $match: { hotelId, createdAt: { $gte: startDate, $lt: endDate } } },
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
              $divide: [
                { $subtract: ["$updatedAt", "$createdAt"] },
                1000 * 60, // minutes
              ],
            },
          },
        },
        { $group: { _id: null, avgMinutes: { $avg: "$responseTime" } } },
      ]),
    ]);

  const totalRequests = statusCounts.reduce((sum, s) => sum + s.count, 0);

  return {
    totalRequests,
    byStatus: statusCounts.map((s) => ({
      status: s._id,
      count: s.count,
    })),
    byType: typeCounts.map((t) => ({
      type: t._id,
      count: t.count,
    })),
    byPriority: priorityCounts.map((p) => ({
      priority: p._id,
      count: p.count,
    })),
    avgResponseTimeMinutes: avgResponseTime[0]?.avgMinutes
      ? Math.round(avgResponseTime[0].avgMinutes * 10) / 10
      : 0,
  };
};

/**
 * Get occupancy trend over time
 */
const getOccupancyTrend = async (hotelId, startDate, endDate) => {
  const trend = await Booking.aggregate([
    {
      $match: {
        hotelId,
        status: { $in: ["checked-in", "checked-out"] },
        checkIn: { $lt: endDate },
        checkOut: { $gte: startDate },
      },
    },
    {
      $project: {
        checkInDate: {
          $dateToString: { format: "%Y-%m-%d", date: "$checkIn" },
        },
        checkOutDate: {
          $dateToString: { format: "%Y-%m-%d", date: "$checkOut" },
        },
      },
    },
  ]);

  // Build daily occupancy from bookings
  const dailyOccupancy = {};

  dateRange(startDate, endDate).forEach((date) => {
    const key = date.toISOString().split("T")[0];
    dailyOccupancy[key] = { occupied: 0, total: 0 };
  });

  // Get total rooms for the hotel
  const totalRooms = await Room.countDocuments({ hotelId });

  trend.forEach((booking) => {
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    dateRange(
      checkIn,
      new Date(Math.min(checkOut.getTime(), endDate.getTime())),
    ).forEach((date) => {
      const key = date.toISOString().split("T")[0];
      if (dailyOccupancy[key]) {
        dailyOccupancy[key].occupied += 1;
      }
    });
  });

  return Object.entries(dailyOccupancy).map(([date, data]) => ({
    date,
    occupied: data.occupied,
    total: totalRooms,
    occupancyRate:
      totalRooms > 0 ? Math.round((data.occupied / totalRooms) * 100) : 0,
  }));
};

/**
 * Main endpoint to get all report data
 */
export const getReportData = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;

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
      getRoomMetrics(hotelId, start, end),
      getBookingMetrics(hotelId, start, end),
      getRevenueMetrics(hotelId, start, end),
      getServiceRequestMetrics(hotelId, start, end),
      getOccupancyTrend(hotelId, start, end),
    ]);

    return res.status(200).json({
      success: true,
      message: "Report data fetched successfully",
      data: {
        hotelName: hotel?.name || "",
        period: {
          start: start.toISOString().split("T")[0],
          end: end.toISOString().split("T")[0],
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
    return res.status(500).json({
      success: false,
      message: "Failed to fetch report data",
    });
  }
};
