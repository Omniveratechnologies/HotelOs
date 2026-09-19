import Hotel from "../models/Hotel.js";
import ChannelManagerConfig from "#/modules/channel-manager/config/models/ChannelManagerConfig.js";
import ChannelApproval from "#/modules/channel-manager/approvals/models/ChannelApproval.js";
import Room from "#/modules/rooms/models/Room.js";
import RatePlan from "#/modules/rate-plans/models/RatePlan.js";
import RoomType from "#/modules/room-types/models/RoomType.js";
import {
  KIND_ROOM,
  KIND_HOTEL,
  recordRequest,
  verifyCodeApproval,
} from "#/modules/channel-manager/approvals/approval.service.js";
import { syncChannelFromAiosell } from "#/shared/services/channelImport.service.js";
import aiosell from "#/shared/services/aiosell.service.js";
import logger from "#/utils/logger.js";

// =====================================================
// HOTEL DETAIL CHANGE REQUEST (UNDER REVIEW)
// Records a KIND_HOTEL change request capturing the fields
// that actually changed, so a SUPER_ADMIN can do the change
// manually in the property and then verify it.
// =====================================================

const HOTEL_REQUEST_FIELDS = [
  "name",
  "email",
  "phone",
  "address",
  "city",
  "checkInTime",
  "checkOutTime",
  "wifiNetworkName",
  "wifiPassword",
  "aiosellHotelCode",
];

function pickChangedFields(before, after, keys) {
  const diffBefore = {};
  const diffAfter = {};

  for (const key of keys) {
    if (String(before[key] ?? "") !== String(after[key] ?? "")) {
      diffBefore[key] = before[key] ?? null;
      diffAfter[key] = after[key] ?? null;
    }
  }

  return { before: diffBefore, after: diffAfter };
}

async function recordHotelChangeRequest(hotelId, before, after, requestedBy) {
  const { before: diffBefore, after: diffAfter } = pickChangedFields(
    before,
    after,
    HOTEL_REQUEST_FIELDS,
  );

  if (
    Object.keys(diffBefore).length === 0 &&
    Object.keys(diffAfter).length === 0
  ) {
    return null;
  }

  return recordRequest(hotelId, KIND_HOTEL, "property", {
    requestedBy,
    before: diffBefore,
    after: diffAfter,
  });
}

function approvalUserShape(user) {
  return user
    ? {
        id: user._id,
        name: user.name,
        username: user.username,
      }
    : null;
}

// =====================================================
// GENERATE UNIQUE HOTEL CODE
// =====================================================

const generateHotelCode = async (name) => {
  // Remove spaces and special characters
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  // First 8 characters
  const baseCode = cleanName.slice(0, 8) || "HOTEL";

  let hotelCode = baseCode;
  let count = 1;

  // Make sure hotel code is unique
  while (
    // oxlint-disable-next-line no-await-in-loop -- ensure a unique code by re-querying after each increment
    await Hotel.findOne({
      hotelCode,
    })
  ) {
    hotelCode = `${baseCode}${count}`;
    count++;
  }

  return hotelCode;
};

// =====================================================
// CREATE HOTEL
// =====================================================

export const createHotel = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      city,
      subscriptionStartDate,
      subscriptionEndDate,
      checkInTime,
      checkOutTime,
      aiosellHotelCode,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!name || !email || !subscriptionStartDate || !subscriptionEndDate) {
      return res.status(400).json({
        success: false,
        message:
          "Hotel name, email, subscription start date and subscription end date are required",
      });
    }

    // =================================================
    // NORMALIZE EMAIL
    // =================================================

    const normalizedEmail = email.toLowerCase().trim();

    // =================================================
    // VALIDATE DATES
    // =================================================

    const startDate = new Date(subscriptionStartDate);

    const endDate = new Date(subscriptionEndDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription dates",
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "Subscription end date must be after the start date",
      });
    }

    // =================================================
    // CHECK EXISTING HOTEL EMAIL
    // =================================================

    const existingHotel = await Hotel.findOne({
      email: normalizedEmail,
    });

    if (existingHotel) {
      return res.status(409).json({
        success: false,
        message: "A hotel with this email already exists",
      });
    }

    // =================================================
    // GENERATE UNIQUE HOTEL CODE
    // =================================================

    const hotelCode = await generateHotelCode(name.trim());

    // =================================================
    // CREATE HOTEL
    // =================================================

    const hotel = await Hotel.create({
      name: name.trim(),

      hotelCode,

      email: normalizedEmail,

      phone: phone?.trim() || "",

      address: address?.trim() || "",

      city: city?.trim() || "",

      subscriptionStartDate: startDate,

      subscriptionEndDate: endDate,

      checkInTime: checkInTime?.trim() || "14:00",

      checkOutTime: checkOutTime?.trim() || "12:00",

      // Optional: map the new hotel straight to an Aiosell property
      aiosellHotelCode: aiosellHotelCode?.trim() || null,

      status: "ACTIVE",
    });

    // The channel manager is a single global config — provisioning it on the
    // first hotel creation gives a fresh deployment a working Aiosell setup.
    // Partner credentials come from env (sandbox in dev, real partner in prod).
    const {
      AIOSELL_PMS_SLUG: pmsSlug,
      AIOSELL_PARTNER_USERNAME: username,
      AIOSELL_PARTNER_PASSWORD: password,
    } = process.env;

    if (pmsSlug && username && password) {
      try {
        const existingConfig = await ChannelManagerConfig.findOne();

        if (!existingConfig) {
          await ChannelManagerConfig.create({
            pmsSlug,
            username,
            password,
            baseUrl:
              process.env.AIOSELL_BASE_URL ||
              "https://live.aiosell.com/api/v2/cm",
            isEnabled: process.env.AIOSELL_ENABLED === "true",
          });

          // Force the aiosell client to re-read the config on the next call
          aiosell.invalidateConfigCache();
        }
      } catch (error) {
        // Best-effort — never fail hotel creation because provisioning broke
        logger.warn(
          { err: error },
          "Channel manager auto-provision failed (hotel still created)",
        );
      }
    } else if (pmsSlug) {
      logger.warn(
        "Channel manager auto-provision skipped: partner credentials are incomplete",
      );
    }

    // Dev convenience: stamp the created hotel with the channel hotel code
    // when one wasn't provided in the request body.
    if (process.env.AIOSELL_HOTEL_CODE && !hotel.aiosellHotelCode) {
      hotel.aiosellHotelCode = process.env.AIOSELL_HOTEL_CODE.trim();
      await hotel.save();
    }

    return res.status(201).json({
      success: true,
      message: "Hotel created successfully",
      data: hotel,
    });
  } catch (error) {
    logger.error(error, "Create hotel error");

    return res.status(500).json({
      success: false,
      message: "Failed to create hotel",
    });
  }
};

// =====================================================
// GET ALL HOTELS
// =====================================================

export const getHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Hotels fetched successfully",
      data: hotels,
    });
  } catch (error) {
    logger.error(error, "Get hotels error");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hotels",
    });
  }
};

// =====================================================
// GET HOTEL BY ID
// =====================================================

export const getHotelById = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hotel fetched successfully",
      data: hotel,
    });
  } catch (error) {
    logger.error(error, "Get hotel by ID error");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hotel",
    });
  }
};

// =====================================================
// UPDATE HOTEL STATUS
// =====================================================

export const updateHotelStatus = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { status } = req.body;

    const normalizedStatus = String(status || "")
      .trim()
      .toUpperCase();

    if (!["ACTIVE", "INACTIVE"].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Status must be ACTIVE or INACTIVE",
      });
    }

    const hotel = await Hotel.findByIdAndUpdate(
      hotelId,
      {
        status: normalizedStatus,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        normalizedStatus === "ACTIVE"
          ? "Hotel activated successfully"
          : "Hotel deactivated successfully",
      data: hotel,
    });
  } catch (error) {
    logger.error(error, "Update hotel status error");

    return res.status(500).json({
      success: false,
      message: "Failed to update hotel status",
    });
  }
};

// =====================================================
// UPDATE HOTEL DETAILS
// =====================================================

export const updateHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const {
      name,
      email,
      phone,
      address,
      city,
      subscriptionStartDate,
      subscriptionEndDate,
      aiosellHotelCode,
    } = req.body;

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const beforeSnapshot = {
      name: hotel.name,
      email: hotel.email,
      phone: hotel.phone,
      address: hotel.address,
      city: hotel.city,
      aiosellHotelCode: hotel.aiosellHotelCode,
    };

    // =================================================
    // UPDATE NAME
    // =================================================

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Hotel name cannot be empty",
        });
      }

      hotel.name = name.trim();
    }

    // =================================================
    // UPDATE EMAIL
    // =================================================

    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();

      const existingHotel = await Hotel.findOne({
        email: normalizedEmail,
        _id: {
          $ne: hotelId,
        },
      });

      if (existingHotel) {
        return res.status(409).json({
          success: false,
          message: "Another hotel already uses this email",
        });
      }

      hotel.email = normalizedEmail;
    }

    // =================================================
    // UPDATE PHONE
    // =================================================

    if (phone !== undefined) {
      hotel.phone = phone?.trim() || "";
    }

    // =================================================
    // UPDATE ADDRESS
    // =================================================

    if (address !== undefined) {
      hotel.address = address?.trim() || "";
    }

    // =================================================
    // UPDATE CITY
    // =================================================

    if (city !== undefined) {
      hotel.city = city?.trim() || "";
    }

    // =================================================
    // UPDATE SUBSCRIPTION START DATE
    // =================================================

    if (subscriptionStartDate !== undefined) {
      const startDate = new Date(subscriptionStartDate);

      if (Number.isNaN(startDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription start date",
        });
      }

      hotel.subscriptionStartDate = startDate;
    }

    // =================================================
    // UPDATE SUBSCRIPTION END DATE
    // =================================================

    if (subscriptionEndDate !== undefined) {
      const endDate = new Date(subscriptionEndDate);

      if (Number.isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription end date",
        });
      }

      hotel.subscriptionEndDate = endDate;
    }

    // =================================================
    // VALIDATE SUBSCRIPTION DATE RANGE
    // =================================================

    if (
      hotel.subscriptionStartDate &&
      hotel.subscriptionEndDate &&
      hotel.subscriptionEndDate <= hotel.subscriptionStartDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Subscription end date must be after the start date",
      });
    }

    // =================================================
    // UPDATE AIOSELL HOTEL CODE
    // =================================================

    if (aiosellHotelCode !== undefined) {
      hotel.aiosellHotelCode =
        aiosellHotelCode === "" ? null : aiosellHotelCode.trim();
    }

    // =================================================
    // SAVE HOTEL
    // =================================================

    await hotel.save();

    const afterSnapshot = {
      name: hotel.name,
      email: hotel.email,
      phone: hotel.phone,
      address: hotel.address,
      city: hotel.city,
      aiosellHotelCode: hotel.aiosellHotelCode,
    };

    await recordHotelChangeRequest(
      hotel._id,
      beforeSnapshot,
      afterSnapshot,
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      message: "Hotel updated successfully",
      data: hotel,
    });
  } catch (error) {
    logger.error(error, "Update hotel error");

    return res.status(500).json({
      success: false,
      message: "Failed to update hotel",
    });
  }
};

// =====================================================
// GET MY HOTEL'S AIOSELL ROOM TYPES (SUB_ADMIN / RECEPTIONIST)
// The room types this hotel's Aiosell property config defines.
// Drives the Room / Rate Plan form dropdowns so new entries are
// always "as per the Aiosell conf" rather than a hardcoded list.
// =====================================================

// =====================================================
// GET ROOM TYPES (SUB_ADMIN / RECEPTIONIST)
// Returns the hotel's locally-mirrored room types (seeded by the Aiosell
// sync). These back the room/rate-plan dropdowns; Aiosell owns the mapping,
// so changes are recorded as ROOM_TYPE approvals for super-admin to verify.
// =====================================================

export const getAiosellRoomTypes = async (req, res) => {
  try {
    const { hotelId } = req.user;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "You are not assigned to a hotel",
      });
    }

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const roomTypes = await RoomType.find({ hotelId }).sort({ roomCode: 1 });

    return res.status(200).json({
      success: true,
      message:
        roomTypes.length > 0
          ? "Room types fetched"
          : "No room types yet — sync the hotel from Aiosell first",
      data: roomTypes.map((type) => ({
        id: type._id,
        code: type.roomCode,
        name: type.name,
        count: type.count,
        active: type.active,
        minOccupancy: type.minOccupancy,
        maxOccupancy: type.maxOccupancy,
        channelSyncStatus: type.channelSyncStatus,
      })),
    });
  } catch (error) {
    logger.error(error, "Get room types error");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch room types",
    });
  }
};

// =====================================================
// GET MY HOTEL (self-service, SUB_ADMIN / RECEPTIONIST)
// =====================================================

export const getMyHotel = async (req, res) => {
  try {
    const { hotelId } = req.user;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "You are not assigned to a hotel",
      });
    }

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hotel fetched successfully",
      data: hotel,
    });
  } catch (error) {
    logger.error(error, "Get my hotel error");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hotel",
    });
  }
};

// =====================================================
// UPDATE MY HOTEL (self-service, SUB_ADMIN / RECEPTIONIST)
// =====================================================

export const updateMyHotel = async (req, res) => {
  try {
    const { hotelId } = req.user;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "You are not assigned to a hotel",
      });
    }

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const {
      name,
      phone,
      address,
      city,
      checkInTime,
      checkOutTime,
      wifiNetworkName,
      wifiPassword,
    } = req.body;

    const beforeSnapshot = {
      name: hotel.name,
      phone: hotel.phone,
      address: hotel.address,
      city: hotel.city,
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
      wifiNetworkName: hotel.wifiNetworkName,
      wifiPassword: hotel.wifiPassword,
    };

    // =================================================
    // UPDATE NAME
    // =================================================

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res
          .status(400)
          .json({ success: false, message: "Hotel name cannot be empty" });
      }
      hotel.name = String(name).trim();
    }

    // =================================================
    // UPDATE PHONE
    // =================================================

    if (phone !== undefined) {
      hotel.phone = String(phone || "").trim();
    }

    // =================================================
    // UPDATE ADDRESS
    // =================================================

    if (address !== undefined) {
      hotel.address = String(address || "").trim();
    }

    // =================================================
    // UPDATE CITY
    // =================================================

    if (city !== undefined) {
      hotel.city = String(city || "").trim();
    }

    // =================================================
    // UPDATE CHECK-IN TIME
    // =================================================

    if (checkInTime !== undefined) {
      hotel.checkInTime = String(checkInTime || "").trim();
    }

    // =================================================
    // UPDATE CHECK-OUT TIME
    // =================================================

    if (checkOutTime !== undefined) {
      hotel.checkOutTime = String(checkOutTime || "").trim();
    }

    // =================================================
    // UPDATE WIFI
    // =================================================

    if (wifiNetworkName !== undefined) {
      hotel.wifiNetworkName = String(wifiNetworkName || "").trim() || null;
    }

    if (wifiPassword !== undefined) {
      hotel.wifiPassword = String(wifiPassword || "").trim() || null;
    }

    await hotel.save();

    const afterSnapshot = {
      name: hotel.name,
      phone: hotel.phone,
      address: hotel.address,
      city: hotel.city,
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
      wifiNetworkName: hotel.wifiNetworkName,
      wifiPassword: hotel.wifiPassword,
    };

    await recordHotelChangeRequest(
      hotel._id,
      beforeSnapshot,
      afterSnapshot,
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      message: "Hotel updated successfully",
      data: hotel,
    });
  } catch (error) {
    logger.error(error, "Update my hotel error");

    return res.status(500).json({
      success: false,
      message: "Failed to update hotel",
    });
  }
};

// =====================================================
// DELETE HOTEL
// =====================================================

export const deleteHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    await Hotel.findByIdAndDelete(hotelId);

    return res.status(200).json({
      success: true,
      message: "Hotel deleted successfully",
    });
  } catch (error) {
    logger.error(error, "Delete hotel error");

    return res.status(500).json({
      success: false,
      message: "Failed to delete hotel",
    });
  }
};

// =====================================================
// GET CHANNEL MANAGER CONFIG (SUPER_ADMIN)
// =====================================================

export const getChannelManagerConfig = async (req, res) => {
  try {
    const config = await ChannelManagerConfig.findOne();

    if (!config) {
      return res.status(200).json({
        success: true,
        message: "Channel manager config fetched",
        data: { pmsSlug: null, baseUrl: null, isEnabled: false },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Channel manager config fetched",
      data: {
        pmsSlug: config.pmsSlug,
        baseUrl: config.baseUrl,
        isEnabled: config.isEnabled,
        lastSyncAt: config.lastSyncAt,
      },
    });
  } catch (error) {
    logger.error(error, "Get channel manager config error");

    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch config" });
  }
};

// =====================================================
// UPDATE CHANNEL MANAGER CONFIG (SUPER_ADMIN)
// password/baseUrl are write-only from the API; never returned.
// =====================================================

export const updateChannelManagerConfig = async (req, res) => {
  try {
    const { pmsSlug, username, password, baseUrl, isEnabled } = req.body;

    let config = await ChannelManagerConfig.findOne();

    if (
      pmsSlug === undefined &&
      username === undefined &&
      password === undefined &&
      baseUrl === undefined &&
      isEnabled === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    if (config) {
      if (pmsSlug !== undefined) config.pmsSlug = pmsSlug;
      if (username !== undefined) config.username = username;
      if (password !== undefined) config.password = password;
      if (baseUrl !== undefined) config.baseUrl = baseUrl;
      if (isEnabled !== undefined) config.isEnabled = isEnabled;
      await config.save();
    } else {
      config = await ChannelManagerConfig.create({
        pmsSlug,
        username,
        password,
        baseUrl,
        isEnabled: isEnabled ?? false,
      });
    }

    // Force the aiosell service to re-read the config on the next call
    aiosell.invalidateConfigCache();

    return res.status(200).json({
      success: true,
      message: "Channel manager config updated",
      data: {
        pmsSlug: config.pmsSlug,
        baseUrl: config.baseUrl,
        isEnabled: config.isEnabled,
      },
    });
  } catch (error) {
    logger.error(error, "Update channel manager config error");

    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "PMS slug already exists" });
    }

    return res
      .status(500)
      .json({ success: false, message: "Failed to update config" });
  }
};

// =====================================================
// GET HOTEL AIOSELL CODE (SUPER_ADMIN)
// =====================================================

export const getHotelAiosellCode = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res
        .status(404)
        .json({ success: false, message: "Hotel not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Aiosell hotel code fetched",
      data: {
        hotelId: hotel._id,
        aiosellHotelCode: hotel.aiosellHotelCode || null,
      },
    });
  } catch (error) {
    logger.error(error, "Get hotel aiosell code error");

    return res.status(500).json({ success: false, message: "Failed to fetch" });
  }
};

// =====================================================
// SET HOTEL AIOSELL CODE (SUPER_ADMIN)
// =====================================================

export const setHotelAiosellCode = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { aiosellHotelCode } = req.body;

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res
        .status(404)
        .json({ success: false, message: "Hotel not found" });
    }

    const before = {
      aiosellHotelCode: hotel.aiosellHotelCode,
    };

    hotel.aiosellHotelCode = aiosellHotelCode?.trim() || null;
    await hotel.save();

    await recordHotelChangeRequest(
      hotel._id,
      before,
      { aiosellHotelCode: hotel.aiosellHotelCode },
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      message: "Property mapping updated",
      data: { hotelId: hotel._id, aiosellHotelCode: hotel.aiosellHotelCode },
    });
  } catch (error) {
    logger.error(error, "Set hotel aiosell code error");

    return res
      .status(500)
      .json({ success: false, message: "Failed to update" });
  }
};

// =====================================================
// LIST CHANNEL APPROVALS (SUPER_ADMIN)
// Pending Aiosell change requests across all hotels, with hotel info,
// requested-by, before/after snapshots and the number of rooms/rate plans
// sharing each code.
// ?kind=ROOM|RATE_PLAN|HOTEL, ?status=under_review|completed
// =====================================================

export const getChannelApprovals = async (req, res) => {
  try {
    const { kind, status } = req.query;

    const match = {};
    if (kind) match.kind = kind;
    if (status) match.status = status;

    const approvals = await ChannelApproval.find(match)
      .sort({ status: 1, createdAt: 1 })
      .populate("hotelId", "name hotelCode")
      .populate("requestedBy", "name username")
      .populate("approvedBy", "name username");

    const enriched = await Promise.all(
      approvals.map(async (approval) => {
        let roomCount = 0;
        let ratePlanCount = 0;

        if (approval.kind === KIND_ROOM) {
          roomCount = await Room.countDocuments({
            hotelId: approval.hotelId,
            roomCode: approval.code,
          });
        } else if (approval.kind === "RATE_PLAN") {
          ratePlanCount = await RatePlan.countDocuments({
            hotelId: approval.hotelId,
            ratePlanCode: approval.code,
          });
        } else if (approval.kind === "ROOM_TYPE") {
          roomCount = await Room.countDocuments({
            hotelId: approval.hotelId,
            roomCode: approval.code,
          });
          ratePlanCount = await RatePlan.countDocuments({
            hotelId: approval.hotelId,
            roomCode: approval.code,
          });
        }

        const userShape = approvalUserShape;

        const updates = approval.updates || approval.after || {};

        return {
          id: approval._id,
          hotelId: approval.hotelId?._id,
          hotelName: approval.hotelId?.name || null,
          hotelCode: approval.hotelId?.hotelCode || null,
          kind: approval.kind,
          code: approval.code,
          action: approval.action || "update",
          roomId: approval.roomId || null,
          roomNumber: approval.roomNumber || null,
          desiredCount: updates?.desiredCount ?? null,
          status: approval.status,
          updates: updates,
          before: approval.before || null,
          after: updates,
          verifyAttempts: approval.verifyAttempts ?? 0,
          lastVerifyResult: approval.lastVerifyResult || null,
          lastVerifyMessage: approval.lastVerifyMessage || null,
          verifyComparison: approval.verifyComparison || null,
          rooms: roomCount,
          ratePlans: ratePlanCount,
          requestedBy: userShape(approval.requestedBy),
          approvedBy: userShape(approval.approvedBy),
          approvedAt: approval.approvedAt,
          verifiedAt: approval.verifiedAt,
          createdAt: approval.createdAt,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Channel approvals fetched",
      data: enriched,
    });
  } catch (error) {
    logger.error(error, "Get channel approvals error");

    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch approvals" });
  }
};

// =====================================================
// VERIFY CHANNEL APPROVAL (SUPER_ADMIN)
// Fetches the Aiosell property and, if the manually-done add/edit is present,
// auto-completes the request. When it isn't present yet the request stays
// under_review with a NOT_FOUND hint so super-admin can retry later. No push —
// the change is already done manually in Aiosell.
// =====================================================

export const verifyChannelApproval = async (req, res) => {
  try {
    const { approvalId } = req.params;

    const approval = await ChannelApproval.findById(approvalId);
    if (!approval) {
      return res.status(404).json({
        success: false,
        message: "Channel approval not found",
      });
    }

    const result = await verifyCodeApproval(
      approval.hotelId,
      approvalId,
      req.user.id,
    );

    if (!result.ok) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    const completed = result.status === "completed";

    return res.status(200).json({
      success: completed,
      message: result.message,
      data: {
        id: approvalId,
        kind: approval.kind,
        code: approval.code,
        status: result.status,
        verifyAttempts: result.approval?.verifyAttempts ?? 0,
        verifyComparison:
          result.comparison || result.approval?.verifyComparison || null,
        lastVerifyMessage: result.message,
      },
    });
  } catch (error) {
    logger.error(error, "Verify channel approval error");

    return res.status(500).json({
      success: false,
      message: "Failed to verify channel approval",
    });
  }
};

// =====================================================
// SYNC HOTEL FROM AIOSELL (SUPER_ADMIN)
// Pulls the Aiosell property mapping (room types + rate plans) and rebuilds
// the hotel's rooms, rate plans and channel approvals to mirror it exactly,
// then pushes availability + rates back. DESTRUCTIVE for the hotel's current
// rooms / rate plans / approvals.
// =====================================================

export const syncFromAiosell = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res
        .status(404)
        .json({ success: false, message: "Hotel not found" });
    }

    const result = await syncChannelFromAiosell(hotelId);

    if (!result.ok) {
      return res
        .status(400)
        .json({ success: false, message: result.error, data: null });
    }

    return res.status(200).json({
      success: true,
      message: "Hotel synced from Aiosell successfully",
      data: result.data,
    });
  } catch (error) {
    logger.error(error, "Sync hotel from Aiosell error");

    return res.status(500).json({
      success: false,
      message: "Failed to sync hotel from Aiosell",
    });
  }
};
