import KioskDevice from "../models/KioskDevice.js";
import {
  KIOSK_DASHBOARDS,
  resolveKioskAssignedUrl,
} from "../config/kioskDashboards.js";
import { generateKioskToken } from "#/shared/utils/jwt.js";
import { getIo } from "#/config/socket.js";
import logger from "#/utils/logger.js";

function generatePairCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function safeEmitToDevice(deviceId, event, payload = {}) {
  try {
    const io = getIo();
    io.to(`device:${deviceId}`).emit(event, payload);
  } catch {
    // Socket server may not be initialized in test/standalone environments
  }
}

// =====================================================
// GET AVAILABLE KIOSK DASHBOARD PRESETS (Super Admin)
// =====================================================
export const getKioskDashboards = async (_req, res) => {
  return res.status(200).json({
    success: true,
    data: KIOSK_DASHBOARDS,
  });
};

// =====================================================
// LIST KIOSK TERMINALS (Super Admin & Hotel Staff)
// =====================================================
export const getKioskDevices = async (req, res) => {
  try {
    const { status, q, hotelId } = req.query;
    const filter = {};

    // SUPER_ADMIN can see all or filter by hotel; others are restricted to their hotel
    if (req.user.role === "SUPER_ADMIN") {
      if (hotelId && hotelId !== "ALL") {
        filter.hotelId = hotelId;
      }
    } else {
      filter.hotelId = req.user.hotelId;
    }

    if (status && status !== "ALL") {
      filter.status = status;
    }

    if (q?.trim()) {
      const rx = new RegExp(
        q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      filter.$or = [{ deviceId: rx }, { name: rx }, { location: rx }];
    }

    // Stale heartbeat check: mark any ONLINE device that hasn't pulsed in 60s as OFFLINE
    // (Heartbeat interval is 30s; missing 2 heartbeats indicates device is disconnected or offline)
    const offlineThreshold = new Date(Date.now() - 60 * 1000);
    await KioskDevice.updateMany(
      {
        status: "ONLINE",
        $or: [
          { lastHeartbeat: { $lt: offlineThreshold } },
          { lastHeartbeat: null },
        ],
      },
      { status: "OFFLINE" },
    );

    const statsMatch =
      req.user.role === "SUPER_ADMIN"
        ? hotelId && hotelId !== "ALL"
          ? {
              hotelId: new (await import("mongoose")).default.Types.ObjectId(
                hotelId,
              ),
            }
          : {}
        : { hotelId: req.user.hotelId };

    const [devices, stats] = await Promise.all([
      KioskDevice.find(filter)
        .populate("hotelId", "name hotelCode city")
        .sort({ createdAt: -1 })
        .lean(),
      KioskDevice.aggregate([
        ...(Object.keys(statsMatch).length > 0 ? [{ $match: statsMatch }] : []),
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const statusMap = Object.fromEntries(stats.map((s) => [s._id, s.count]));

    return res.status(200).json({
      success: true,
      message: "Kiosks fetched",
      data: {
        devices,
        stats: {
          total: devices.length,
          online: statusMap.ONLINE || 0,
          offline: statusMap.OFFLINE || 0,
          maintenance: statusMap.MAINTENANCE || 0,
          disabled: statusMap.DISABLED || 0,
        },
      },
    });
  } catch (error) {
    logger.error(error, "Get Kiosk Devices Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch kiosk devices" });
  }
};

// =====================================================
// CREATE / REGISTER KIOSK (Super Admin Only)
// =====================================================
export const createKioskDevice = async (req, res) => {
  try {
    const {
      hotelId,
      deviceId,
      name,
      location,
      targetDashboard,
      customUrl,
      supportedFeatures,
      firmwareVersion,
    } = req.body;

    const assignedHotelId = hotelId || req.user.hotelId;

    if (!assignedHotelId || !deviceId?.trim() || !name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Hotel, Device ID and Name are required",
      });
    }

    const cleanDeviceId = deviceId.trim().toUpperCase();
    const existing = await KioskDevice.findOne({ deviceId: cleanDeviceId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A kiosk terminal with Device ID "${cleanDeviceId}" already exists`,
      });
    }

    const pairCode = generatePairCode();
    const dashboardType = targetDashboard || "DEMO_URL";

    const initialKiosk = {
      hotelId: assignedHotelId,
      deviceId: cleanDeviceId,
      name: name.trim(),
      location: location?.trim() || "Main Lobby",
      targetDashboard: dashboardType,
      customUrl: customUrl?.trim() || null,
      pairCode,
      status: "ONLINE",
      firmwareVersion: firmwareVersion?.trim() || "v1.4.0",
      supportedFeatures: supportedFeatures || [
        "CHECK_IN",
        "KEY_DISPENSE",
        "DOCUMENT_SCAN",
      ],
      isPaired: false,
    };

    const assignedUrl = resolveKioskAssignedUrl(initialKiosk);

    const device = await KioskDevice.create({
      ...initialKiosk,
      assignedUrl,
    });

    const populated = await KioskDevice.findById(device._id)
      .populate("hotelId", "name hotelCode city")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Kiosk terminal registered successfully",
      data: populated,
    });
  } catch (error) {
    logger.error(error, "Create Kiosk Device Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to register kiosk device" });
  }
};

// =====================================================
// UPDATE KIOSK / REASSIGN HOTEL & DASHBOARD (Super Admin Only)
// =====================================================
export const updateKioskDevice = async (req, res) => {
  try {
    const device = await KioskDevice.findById(req.params.id);
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Kiosk device not found" });
    }

    // Role-based authorization:
    // Hotel staff (RECEPTIONIST, SUB_ADMIN) can only update kiosks belonging to their hotel
    if (req.user.role !== "SUPER_ADMIN") {
      if (
        !req.user.hotelId ||
        String(device.hotelId) !== String(req.user.hotelId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only update kiosks belonging to your assigned hotel",
        });
      }

      // Prohibit non-super-admins from reassigning hotel, dashboard preset, or customUrl
      if (
        req.body.hotelId !== undefined ||
        req.body.targetDashboard !== undefined ||
        req.body.customUrl !== undefined
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only Super Admin can reassign hotel or dashboard configuration",
        });
      }
    }

    const allowed = [
      "hotelId",
      "name",
      "location",
      "status",
      "targetDashboard",
      "customUrl",
      "firmwareVersion",
      "supportedFeatures",
      "isActive",
    ];

    let urlOrHotelChanged = false;

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (
          key === "hotelId" ||
          key === "targetDashboard" ||
          key === "customUrl"
        ) {
          if (String(device[key]) !== String(req.body[key])) {
            urlOrHotelChanged = true;
          }
        }
        device[key] = req.body[key];
      }
    }

    if (urlOrHotelChanged) {
      device.assignedUrl = resolveKioskAssignedUrl(device);
    }

    await device.save();

    const populated = await KioskDevice.findById(device._id)
      .populate("hotelId", "name hotelCode city")
      .lean();

    // Notify connected terminal via Socket.IO if URL or target dashboard changed
    if (urlOrHotelChanged || req.body.status) {
      safeEmitToDevice(device.deviceId, "device:navigate", {
        url: device.assignedUrl,
        targetDashboard: device.targetDashboard,
        hotelId: device.hotelId,
      });
      safeEmitToDevice(device.deviceId, "device:config-updated", {
        status: device.status,
        targetDashboard: device.targetDashboard,
        assignedUrl: device.assignedUrl,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Kiosk device updated",
      data: populated,
    });
  } catch (error) {
    logger.error(error, "Update Kiosk Device Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to update kiosk device" });
  }
};

// =====================================================
// REGENERATE PAIR CODE (Super Admin Only)
// =====================================================
export const regeneratePairCode = async (req, res) => {
  try {
    const device = await KioskDevice.findById(req.params.id);
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Kiosk device not found" });
    }

    device.pairCode = generatePairCode();
    device.isPaired = false;
    await device.save();

    return res.status(200).json({
      success: true,
      message: "New pairing code generated",
      data: { pairCode: device.pairCode },
    });
  } catch (error) {
    logger.error(error, "Regenerate Pair Code Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to regenerate pairing code" });
  }
};

// =====================================================
// SEND REMOTE COMMAND TO KIOSK (Super Admin Only)
// =====================================================
export const sendKioskRemoteCommand = async (req, res) => {
  try {
    const { command, payload } = req.body;
    const device = await KioskDevice.findById(req.params.id);
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Kiosk device not found" });
    }

    safeEmitToDevice(device.deviceId, command, payload || {});

    return res.status(200).json({
      success: true,
      message: `Command "${command}" dispatched to terminal ${device.name}`,
    });
  } catch (error) {
    logger.error(error, "Send Kiosk Command Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to dispatch remote command" });
  }
};

// =====================================================
// DELETE KIOSK (Super Admin Only)
// =====================================================
export const deleteKioskDevice = async (req, res) => {
  try {
    const device = await KioskDevice.findById(req.params.id);
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Kiosk device not found" });
    }

    safeEmitToDevice(device.deviceId, "device:exit-kiosk", {
      reason: "Terminal deleted by Super Admin",
    });

    await device.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Kiosk terminal removed",
    });
  } catch (error) {
    logger.error(error, "Delete Kiosk Device Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to remove kiosk device" });
  }
};

// =====================================================
// ONE-TIME DEVICE PAIRING (Public Device Endpoint)
// =====================================================
export const pairKiosk = async (req, res) => {
  try {
    const {
      pairCode,
      deviceId,
      firmwareVersion,
      appVersion,
      supportedFeatures,
      ipAddress,
    } = req.body;

    if (!pairCode?.trim() || !deviceId?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Pairing code and Device ID are required",
      });
    }

    const cleanPairCode = pairCode.trim();
    const cleanDeviceId = deviceId.trim().toUpperCase();

    const device = await KioskDevice.findOne({
      pairCode: cleanPairCode,
      isActive: true,
    }).populate("hotelId", "name hotelCode city");

    if (!device) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired pairing code",
      });
    }

    // Bind hardware deviceId, mark paired, and clear one-time pairCode
    device.deviceId = cleanDeviceId;
    device.isPaired = true;
    device.pairedAt = new Date();
    device.pairCode = null; // Invalidate pairCode so it cannot be reused
    device.status = "ONLINE";
    device.lastHeartbeat = new Date();

    if (firmwareVersion) device.firmwareVersion = firmwareVersion.trim();
    if (appVersion) device.appVersion = appVersion.trim();
    if (ipAddress) device.ipAddress = ipAddress.trim();
    if (supportedFeatures?.length) device.supportedFeatures = supportedFeatures;

    device.assignedUrl = resolveKioskAssignedUrl(device);
    await device.save();

    // Generate cryptographic device JWT token
    const token = generateKioskToken(device);

    return res.status(200).json({
      success: true,
      message: "Kiosk terminal paired successfully",
      data: {
        token,
        kiosk: {
          id: device._id,
          deviceId: device.deviceId,
          name: device.name,
          location: device.location,
          hotelId: device.hotelId?._id || device.hotelId,
          hotelName: device.hotelId?.name || "Assigned Hotel",
          targetDashboard: device.targetDashboard,
          assignedUrl: device.assignedUrl,
        },
      },
    });
  } catch (error) {
    logger.error(error, "Pair Kiosk Device Error");
    return res
      .status(500)
      .json({ success: false, message: "Device pairing failed" });
  }
};

// =====================================================
// KIOSK HEARTBEAT (Authenticated Kiosk Endpoint)
// =====================================================
export const kioskHeartbeat = async (req, res) => {
  try {
    const { batteryLevel, appVersion, ipAddress } = req.body;
    const device = req.kiosk;

    device.lastHeartbeat = new Date();
    // Only transition back to ONLINE if the device was OFFLINE.
    // Preserve intentional administrative states (MAINTENANCE, DISABLED).
    if (device.status === "OFFLINE") {
      device.status = "ONLINE";
    }

    if (typeof batteryLevel === "number") {
      device.batteryLevel = batteryLevel;
    }
    if (appVersion?.trim()) {
      device.appVersion = appVersion.trim();
    }
    if (ipAddress?.trim()) {
      device.ipAddress = ipAddress.trim();
    }

    await device.save();

    return res.status(200).json({
      success: true,
      message: "Heartbeat acknowledged",
      data: {
        assignedUrl: device.assignedUrl,
        targetDashboard: device.targetDashboard,
        status: device.status,
      },
    });
  } catch (error) {
    logger.error(error, "Kiosk Heartbeat Error");
    return res
      .status(500)
      .json({ success: false, message: "Heartbeat update failed" });
  }
};

// =====================================================
// GET KIOSK CONFIG / STATUS (Authenticated Kiosk Endpoint)
// =====================================================
export const getKioskStatus = async (req, res) => {
  try {
    const device = await KioskDevice.findById(req.kiosk._id)
      .populate("hotelId", "name hotelCode city")
      .lean();

    return res.status(200).json({
      success: true,
      data: device,
    });
  } catch (error) {
    logger.error(error, "Get Kiosk Status Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch kiosk status" });
  }
};
