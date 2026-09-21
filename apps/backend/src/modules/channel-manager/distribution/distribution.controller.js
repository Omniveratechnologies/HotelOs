import aiosell from "#/shared/services/aiosell.service.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import Room from "#/modules/rooms/models/Room.js";
import RoomType from "#/modules/room-types/models/RoomType.js";
import RatePlan from "#/modules/rate-plans/models/RatePlan.js";
import { validateAndNormalizeDateRange } from "#/shared/services/inventory.service.js";
import {
  formatRatesMatrix,
  formatInventoryMatrix,
} from "./distribution.service.js";
import logger from "#/utils/logger.js";

function getDatesInRange(start, end) {
  const dates = [];
  const startMs = new Date(`${start}T00:00:00Z`).getTime();
  const endMs = new Date(`${end}T00:00:00Z`).getTime();
  for (let ms = startMs; ms <= endMs; ms += 86400000) {
    dates.push(new Date(ms).toISOString().slice(0, 10));
  }
  return dates;
}

// GET /distribution/rates?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&hotelId=...
export const getLiveRates = async (req, res) => {
  try {
    const {
      hotelId,
      startDate: queryStartDate,
      endDate: queryEndDate,
    } = req.validated?.query || {};

    const hotelIdResolved =
      req.user?.role === "SUPER_ADMIN"
        ? hotelId || req.user.hotelId
        : req.user.hotelId;

    if (!hotelIdResolved) {
      return res
        .status(400)
        .json({ success: false, message: "Hotel ID required" });
    }

    const hotel = await Hotel.findById(hotelIdResolved);
    if (!hotel || !hotel.aiosellHotelCode) {
      return res
        .status(404)
        .json({ success: false, message: "Hotel not mapped to Aiosell" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const tenDaysLater = new Date(Date.now() + 9 * 86400000)
      .toISOString()
      .slice(0, 10);
    const [startDate, endDate] = validateAndNormalizeDateRange(
      queryStartDate || today,
      queryEndDate || tenDaysLater,
    );

    const dates = getDatesInRange(startDate, endDate);
    const [fetched, localRoomTypes, localRatePlans] = await Promise.all([
      aiosell.fetchRates(hotel.aiosellHotelCode, startDate, endDate),
      RoomType.find({ hotelId }).lean(),
      RatePlan.find({ hotelId }).lean(),
    ]);

    if (!fetched.ok) {
      return res.status(502).json({
        success: false,
        message: fetched.error || "Failed to fetch rates from Aiosell",
      });
    }

    const rawUpdates = fetched.data?.updates || [];
    const matrix = formatRatesMatrix(
      dates,
      rawUpdates,
      localRoomTypes,
      localRatePlans,
    );

    return res.status(200).json({
      success: true,
      data: {
        hotel: {
          id: hotel._id,
          name: hotel.name,
          code: hotel.aiosellHotelCode,
        },
        startDate,
        endDate,
        ...matrix,
      },
    });
  } catch (error) {
    logger.error(error, "Get live rates error");
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch rates",
    });
  }
};

// POST /distribution/rates
export const updateRates = async (req, res) => {
  try {
    const { hotelId, updates } = req.validated?.body || {};

    const hotelIdResolved =
      req.user?.role === "SUPER_ADMIN"
        ? hotelId || req.user.hotelId
        : req.user.hotelId;

    if (!hotelIdResolved) {
      return res
        .status(400)
        .json({ success: false, message: "Hotel ID required" });
    }

    const hotel = await Hotel.findById(hotelIdResolved);
    if (!hotel?.aiosellHotelCode) {
      return res
        .status(404)
        .json({ success: false, message: "Hotel not mapped to Aiosell" });
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Updates array required" });
    }

    const result = await aiosell.pushRates(hotel.aiosellHotelCode, updates);
    if (!result.ok) {
      return res
        .status(502)
        .json({ success: false, message: result.error || "Rate push failed" });
    }

    // Update local rate plans with the new rate if applicable
    const localUpdates = [];
    for (const u of updates) {
      for (const r of u.rates || []) {
        if (r.rateplanCode && r.rate != null) {
          localUpdates.push(
            RatePlan.updateMany(
              {
                hotelId: hotelIdResolved,
                ratePlanCode: String(r.rateplanCode).toLowerCase(),
              },
              { $set: { rate: Number(r.rate) } },
            ),
          );
        }
      }
    }
    if (localUpdates.length > 0) {
      await Promise.all(localUpdates);
    }

    return res.status(200).json({
      success: true,
      message: "Rates updated successfully in Aiosell",
      data: result.data,
    });
  } catch (error) {
    logger.error(error, "Update rates error");
    return res
      .status(500)
      .json({ success: false, message: error.message || "Rate update failed" });
  }
};

// POST /distribution/rate-restrictions
export const updateRateRestrictions = async (req, res) => {
  try {
    const { hotelId, updates } = req.validated?.body || {};

    const hotelIdResolved =
      req.user?.role === "SUPER_ADMIN"
        ? hotelId || req.user.hotelId
        : req.user.hotelId;

    const hotel = await Hotel.findById(hotelIdResolved);
    if (!hotel?.aiosellHotelCode) {
      return res
        .status(404)
        .json({ success: false, message: "Hotel not mapped to Aiosell" });
    }
    const result = await aiosell.pushRateRestrictions(
      hotel.aiosellHotelCode,
      updates,
    );
    if (!result.ok) {
      return res.status(502).json({
        success: false,
        message: result.error || "Rate restrictions push failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rate restrictions updated in Aiosell",
      data: result.data,
    });
  } catch (error) {
    logger.error(error, "Rate restrictions error");
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update rate restrictions",
    });
  }
};

// GET /distribution/inventory (Super-Admin)
export const getLiveInventory = async (req, res) => {
  try {
    const {
      hotelId,
      startDate: queryStartDate,
      endDate: queryEndDate,
    } = req.validated?.query || {};

    const hotelIdResolved = hotelId || req.user.hotelId;
    if (!hotelIdResolved) {
      return res
        .status(400)
        .json({ success: false, message: "Hotel ID required" });
    }

    const hotel = await Hotel.findById(hotelIdResolved);
    if (!hotel?.aiosellHotelCode) {
      return res
        .status(404)
        .json({ success: false, message: "Hotel not mapped to Aiosell" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const tenDaysLater = new Date(Date.now() + 9 * 86400000)
      .toISOString()
      .slice(0, 10);
    const [startDate, endDate] = validateAndNormalizeDateRange(
      queryStartDate || today,
      queryEndDate || tenDaysLater,
    );

    const dates = getDatesInRange(startDate, endDate);
    const [fetched, localRoomTypes, totalRooms] = await Promise.all([
      aiosell.fetchInventory(hotel.aiosellHotelCode, startDate, endDate),
      RoomType.find({ hotelId }).lean(),
      Room.countDocuments({ hotelId }),
    ]);

    if (!fetched.ok) {
      return res.status(502).json({
        success: false,
        message: fetched.error || "Failed to fetch inventory from Aiosell",
      });
    }

    const rawUpdates = fetched.data?.updates || [];
    const matrix = formatInventoryMatrix(
      dates,
      rawUpdates,
      totalRooms,
      localRoomTypes,
    );

    return res.status(200).json({
      success: true,
      data: {
        hotel: {
          id: hotel._id,
          name: hotel.name,
          code: hotel.aiosellHotelCode,
        },
        startDate,
        endDate,
        ...matrix,
      },
    });
  } catch (error) {
    logger.error(error, "Get live inventory error");
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch inventory",
    });
  }
};

// POST /distribution/inventory (Super-Admin)
export const updateInventory = async (req, res) => {
  try {
    const { hotelId, updates } = req.validated?.body || {};

    const hotelIdResolved = hotelId || req.user.hotelId;
    const hotel = await Hotel.findById(hotelIdResolved);
    if (!hotel?.aiosellHotelCode) {
      return res
        .status(404)
        .json({ success: false, message: "Hotel not mapped to Aiosell" });
    }
    const result = await aiosell.pushInventory(hotel.aiosellHotelCode, updates);
    if (!result.ok) {
      return res.status(502).json({
        success: false,
        message: result.error || "Inventory push failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inventory updated in Aiosell",
      data: result.data,
    });
  } catch (error) {
    logger.error(error, "Update inventory error");
    return res.status(500).json({
      success: false,
      message: error.message || "Inventory update failed",
    });
  }
};

// POST /distribution/inventory-restrictions (Super-Admin)
export const updateInventoryRestrictions = async (req, res) => {
  try {
    const { hotelId, updates } = req.validated?.body || {};

    const hotelIdResolved = hotelId || req.user.hotelId;
    const hotel = await Hotel.findById(hotelIdResolved);
    if (!hotel?.aiosellHotelCode) {
      return res
        .status(404)
        .json({ success: false, message: "Hotel not mapped to Aiosell" });
    }
    const result = await aiosell.pushInventoryRestrictions(
      hotel.aiosellHotelCode,
      updates,
    );
    if (!result.ok) {
      return res.status(502).json({
        success: false,
        message: result.error || "Inventory restrictions push failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inventory restrictions updated in Aiosell",
      data: result.data,
    });
  } catch (error) {
    logger.error(error, "Inventory restrictions error");
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update inventory restrictions",
    });
  }
};

// POST /distribution/mark-noshow
export const markNoShow = async (req, res) => {
  try {
    const { hotelId, bookingId } = req.validated?.body || {};

    const hotelIdResolved =
      req.user?.role === "SUPER_ADMIN"
        ? hotelId || req.user.hotelId
        : req.user.hotelId;

    const hotel = await Hotel.findById(hotelIdResolved);
    if (!hotel?.aiosellHotelCode) {
      return res
        .status(404)
        .json({ success: false, message: "Hotel not mapped to Aiosell" });
    }

    if (!bookingId) {
      return res
        .status(400)
        .json({ success: false, message: "bookingId required" });
    }

    const result = await aiosell.markNoShow(hotel.aiosellHotelCode, bookingId);
    if (!result.ok) {
      return res.status(502).json({
        success: false,
        message: result.error || "Mark no-show failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reservation marked as No-Show in Aiosell",
      data: result.data,
    });
  } catch (error) {
    logger.error(error, "Mark no-show error");
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark no-show",
    });
  }
};
