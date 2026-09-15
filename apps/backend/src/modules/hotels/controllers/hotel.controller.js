import Hotel from "../models/Hotel.js";
import ChannelManagerConfig from "#/modules/channel-manager/models/ChannelManagerConfig.js";
import ChannelApproval from "#/modules/channel-manager/models/ChannelApproval.js";
import Room from "#/modules/rooms/models/Room.js";
import RatePlan from "#/modules/rate-plans/models/RatePlan.js";
import {
  KIND_ROOM,
  KIND_RATE_PLAN,
  getOrCreateApproval,
  markCodeApproved,
} from "#/modules/channel-manager/services/approval.service.js";
import {
  aiosellSyncInventory,
  aiosellSyncRates,
} from "#/shared/services/inventory.service.js";
import aiosell from "#/shared/services/aiosell.service.js";
import logger from "#/utils/logger.js";

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

      status: "ACTIVE",
    });

    // The channel manager is a single global config — provisioning it on the
    // first hotel creation gives a fresh deployment a working Aiosell setup.
    // Partner credentials come from env (sandbox in dev, real partner in prod).
    if (process.env.AIOSELL_PMS_SLUG) {
      try {
        const existingConfig = await ChannelManagerConfig.findOne();

        if (!existingConfig) {
          await ChannelManagerConfig.create({
            pmsSlug: process.env.AIOSELL_PMS_SLUG,
            username: process.env.AIOSELL_PARTNER_USERNAME || "aiosell",
            password: process.env.AIOSELL_PARTNER_PASSWORD || "AIOsell@123",
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
    }

    // Dev convenience: stamp the created hotel with the channel hotel code
    if (process.env.AIOSELL_HOTEL_CODE) {
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

    const { phone, address, city, checkInTime, checkOutTime } = req.body;

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

    await hotel.save();

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

    const hotel = await Hotel.findByIdAndUpdate(
      hotelId,
      { aiosellHotelCode: aiosellHotelCode?.trim() || null },
      { new: true },
    );

    if (!hotel) {
      return res
        .status(404)
        .json({ success: false, message: "Hotel not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Aiosell hotel code updated",
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
// Pending Aiosell codes across all hotels, with hotel info
// and the number of rooms/rate plans sharing each code.
// ?kind=ROOM|RATE_PLAN, ?status=under_review|completed
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
      .populate("approvedBy", "name username");

    const enriched = await Promise.all(
      approvals.map(async (approval) => {
        const [roomCount, ratePlanCount] =
          approval.kind === KIND_ROOM
            ? [
                await Room.countDocuments({
                  hotelId: approval.hotelId,
                  roomCode: approval.code,
                }),
                0,
              ]
            : [
                0,
                await RatePlan.countDocuments({
                  hotelId: approval.hotelId,
                  ratePlanCode: approval.code,
                }),
              ];

        return {
          id: approval._id,
          hotelId: approval.hotelId?._id,
          hotelName: approval.hotelId?.name || null,
          hotelCode: approval.hotelId?.hotelCode || null,
          kind: approval.kind,
          code: approval.code,
          status: approval.status,
          rooms: roomCount,
          ratePlans: ratePlanCount,
          approvedBy: approval.approvedBy
            ? {
                id: approval.approvedBy._id,
                name: approval.approvedBy.name,
                username: approval.approvedBy.username,
              }
            : null,
          approvedAt: approval.approvedAt,
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
// APPROVE CHANNEL CODE + FULL HOTEL RE-SYNC (SUPER_ADMIN)
// Marks the code "completed", flips dependent Room/RatePlan
// docs to completed, then pushes inventory + rates for the
// hotel. Returns the sync outcome so the UI can report it.
// =====================================================

export const approveChannelCode = async (req, res) => {
  try {
    const { approvalId } = req.params;

    const approval = await ChannelApproval.findById(approvalId);
    if (!approval) {
      return res.status(404).json({
        success: false,
        message: "Channel approval not found",
      });
    }

    const hotelId = approval.hotelId;
    const { updatedDocs } = await markCodeApproved(
      hotelId,
      approval.kind,
      approval.code,
      req.user.id,
    );

    // When a ROOM type is approved, rate plans whose ratePlanCode is already
    // approved (but were stuck "under_review" because the room type was not)
    // become pushable too — unlock them.
    if (approval.kind === KIND_ROOM) {
      const stuckPlans = await RatePlan.find({
        hotelId,
        roomCode: approval.code,
        channelSyncStatus: "under_review",
      });

      for (const ratePlan of stuckPlans) {
        const codeApproval = await getOrCreateApproval(
          hotelId,
          KIND_RATE_PLAN,
          ratePlan.ratePlanCode,
        );
        if (codeApproval.status === "completed") {
          ratePlan.channelSyncStatus = "completed";
          await ratePlan.save();
        }
      }
    }

    // Full hotel re-sync (approved codes only — payloads are filtered).
    const inventorySync = await aiosellSyncInventory(hotelId);
    const ratesSync = await aiosellSyncRates(hotelId);

    const syncOk = !!(inventorySync.ok || ratesSync.ok);
    const syncMessage = [
      inventorySync.ok ? "inventory" : null,
      ratesSync.ok ? "rates" : null,
    ]
      .filter(Boolean)
      .join(" + ");

    return res.status(200).json({
      success: syncOk,
      message: syncOk
        ? `Code approved and synced (${syncMessage})`
        : `Code approved, but sync failed: ${inventorySync.error || ratesSync.error}`,
      data: {
        approval: {
          id: approval._id,
          kind: approval.kind,
          code: approval.code,
          status: "completed",
        },
        updatedDocs,
        sync: { inventory: inventorySync, rates: ratesSync },
      },
    });
  } catch (error) {
    logger.error(error, "Approve channel code error");

    return res.status(500).json({
      success: false,
      message: "Failed to approve channel code",
    });
  }
};
