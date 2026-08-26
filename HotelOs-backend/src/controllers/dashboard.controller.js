import User from "../models/User.js";
import Hotel from "../models/Hotel.js";

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
        message: "You are not assigned to a hotel"
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
      role: { $in: ["RECEPTIONIST", "KITCHEN"] }
    });

    // =================================================
    // ROOMS BY STATUS (populated in Phase B1)
    // =================================================

    // TODO(Phase B1): aggregate real Room counts per status
    const rooms = {
      total: 0,
      available: 0,
      occupied: 0,
      reserved: 0,
      cleaning: 0
    };

    // =================================================
    // GUEST ACTIVITY (populated in Phase B2)
    // =================================================

    // TODO(Phase B2): compute from Guest model
    const guests = {
      checkedIn: 0,
      arrivalsToday: 0,
      departuresToday: 0
    };

    const occupancyPercent =
      rooms.total > 0
        ? Math.round((rooms.occupied / rooms.total) * 100)
        : 0;

    // TODO(Phase B2/B3): derive from reservations & service requests
    const pendingReservations = 0;
    const pendingServiceRequests = 0;

    // TODO(Phase B2): compute from billing/payments
    const revenueToday = 0;

    // =================================================
    // RECENT ACTIVITY FEED (populated in Phase B2/B3)
    // =================================================

    // TODO(Phase B2/B3): merge latest guest + room events
    const recentActivities = [];

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
        recentActivities
      }
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats"
    });
  }
};
