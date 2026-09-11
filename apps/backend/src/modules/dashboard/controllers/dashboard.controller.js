import User from "#/modules/users/models/User.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import Room from "#/modules/rooms/models/Room.js";
import Booking from "#/modules/bookings/models/Booking.js";
import logger from "#/utils/logger.js";

// =====================================================
// DASHBOARD STATS (hotel-scoped)
// =====================================================
// Room / guest / reservation metrics are wired to their
// models in the Receptionist phase (B1-B3); they return
// neutral values until those models exist.

export const getDashboardStats = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "You are not assigned to a hotel",
      });
    }

    // =================================================
    // HOTEL
    // =================================================

    const hotel = await Hotel.findById(hotelId).select("name");

    // =================================================
    // ACTIVE STAFF
    // =================================================

    const activeStaff = await User.countDocuments({
      hotelId,
      isActive: true,
      role: { $in: ["RECEPTIONIST", "KITCHEN"] },
    });

    // =================================================
    // ROOMS BY STATUS
    // =================================================

    const roomStatusCounts = await Room.aggregate([
      { $match: { hotelId: hotel._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statusCount = (status) =>
      roomStatusCounts.find((r) => r._id === status)?.count || 0;

    const rooms = {
      total: roomStatusCounts.reduce((sum, r) => sum + r.count, 0),
      available: statusCount("available"),
      occupied: statusCount("occupied"),
      reserved: statusCount("reserved"),
      cleaning: statusCount("cleaning"),
    };

    // =================================================
    // GUEST ACTIVITY
    // =================================================

    const startOfToday = new Date();

    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(startOfToday);

    endOfToday.setDate(endOfToday.getDate() + 1);

    const [checkedIn, arrivalsToday, departuresToday] = await Promise.all([
      Booking.countDocuments({ hotelId, status: "checked-in" }),
      Booking.countDocuments({
        hotelId,
        checkIn: { $gte: startOfToday, $lt: endOfToday },
      }),
      Booking.countDocuments({
        hotelId,
        checkOut: { $gte: startOfToday, $lt: endOfToday },
        status: { $ne: "checked-out" },
      }),
    ]);

    const guests = {
      checkedIn,
      arrivalsToday,
      departuresToday,
    };

    const occupancyPercent =
      rooms.total > 0 ? Math.round((rooms.occupied / rooms.total) * 100) : 0;

    // TODO(Phase B2/B3): derive from reservations & service requests
    const pendingReservations = 0;
    const pendingServiceRequests = 0;

    // TODO(Phase B2): compute from billing/payments
    const revenueToday = 0;

    // =================================================
    // RECENT ACTIVITY FEED (latest guest events)
    // =================================================

    const recentGuests = await Booking.find({ hotelId })
      .sort({ updatedAt: -1 })
      .limit(6)
      .populate("roomId", "roomNumber")
      .populate("guestId", "name");

    const recentActivities = recentGuests.map((b) => {
      const guestName = b.guestId?.name || "Guest";
      let text;

      if (b.status === "checked-out") {
        text = `${guestName} checked out`;
      } else if (b.status === "reserved") {
        text = `Reservation for ${guestName}`;
      } else {
        text = `${guestName} checked in`;
      }

      if (b.roomId?.roomNumber) {
        text += ` — Room ${b.roomId.roomNumber}`;
      }

      return {
        id: b._id,
        text,
        tone: b.status === "checked-in" ? "gold" : "default",
        createdAt: b.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",
      data: {
        hotelName: hotel?.name || "",
        rooms,
        guests,
        occupancyPercent,
        pendingReservations,
        pendingServiceRequests,
        revenueToday,
        activeStaff,
        recentActivities,
      },
    });
  } catch (error) {
    logger.error(error, "Get dashboard stats error");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
    });
  }
};
