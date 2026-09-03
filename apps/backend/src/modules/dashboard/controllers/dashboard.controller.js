import User from "../../users/models/User.js";
import Hotel from "../../hotels/models/Hotel.js";
import Room from "../../rooms/models/Room.js";
import Guest from "../../guests/models/Guest.js";

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
      Guest.countDocuments({ hotelId, status: "checked-in" }),
      Guest.countDocuments({
        hotelId,
        checkIn: { $gte: startOfToday, $lt: endOfToday },
      }),
      Guest.countDocuments({
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

    const recentGuests = await Guest.find({ hotelId })
      .sort({ updatedAt: -1 })
      .limit(6)
      .populate("roomId", "roomNumber");

    const recentActivities = recentGuests.map((g) => {
      let text;

      if (g.status === "checked-out") {
        text = `${g.name} checked out`;
      } else if (g.status === "reserved") {
        text = `Reservation for ${g.name}`;
      } else {
        text = `${g.name} checked in`;
      }

      if (g.roomId?.roomNumber) {
        text += ` — Room ${g.roomId.roomNumber}`;
      }

      return {
        id: g._id,
        text,
        tone: g.status === "checked-in" ? "gold" : "default",
        createdAt: g.updatedAt,
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
    console.error("Get dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
    });
  }
};
