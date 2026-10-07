import KioskDevice from "../models/KioskDevice.js";
import logger from "#/utils/logger.js";

function generatePairCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// =====================================================
// LIST KIOSK TERMINALS
// =====================================================
export const getKioskDevices = async (req, res) => {
  try {
    const { status, q } = req.query;
    const filter = { hotelId: req.user.hotelId };

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

    const [devices, stats] = await Promise.all([
      KioskDevice.find(filter).sort({ name: 1 }).lean(),
      KioskDevice.aggregate([
        { $match: { hotelId: req.user.hotelId } },
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
// CREATE / REGISTER KIOSK
// =====================================================
export const createKioskDevice = async (req, res) => {
  try {
    const { deviceId, name, location, supportedFeatures, firmwareVersion } =
      req.body;

    if (!deviceId?.trim() || !name?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Device ID and Name are required" });
    }

    const cleanDeviceId = deviceId.trim().toUpperCase();
    const existing = await KioskDevice.findOne({
      hotelId: req.user.hotelId,
      deviceId: cleanDeviceId,
    });
    if (existing) {
      return res
        .status(409)
        .json({
          success: false,
          message: "A kiosk with this Device ID already exists",
        });
    }

    const device = await KioskDevice.create({
      hotelId: req.user.hotelId,
      deviceId: cleanDeviceId,
      name: name.trim(),
      location: location?.trim() || "Main Lobby",
      pairCode: generatePairCode(),
      firmwareVersion: firmwareVersion?.trim() || "v1.4.0",
      supportedFeatures: supportedFeatures || [
        "CHECK_IN",
        "KEY_DISPENSE",
        "DOCUMENT_SCAN",
      ],
      status: "ONLINE",
    });

    return res.status(201).json({
      success: true,
      message: "Kiosk terminal registered successfully",
      data: device,
    });
  } catch (error) {
    logger.error(error, "Create Kiosk Device Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to register kiosk device" });
  }
};

// =====================================================
// UPDATE KIOSK
// =====================================================
export const updateKioskDevice = async (req, res) => {
  try {
    const device = await KioskDevice.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Kiosk device not found" });
    }

    const allowed = [
      "name",
      "location",
      "status",
      "firmwareVersion",
      "supportedFeatures",
      "isActive",
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        device[key] = req.body[key];
      }
    }

    await device.save();

    return res.status(200).json({
      success: true,
      message: "Kiosk device updated",
      data: device,
    });
  } catch (error) {
    logger.error(error, "Update Kiosk Device Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to update kiosk device" });
  }
};

// =====================================================
// REGENERATE PAIR CODE
// =====================================================
export const regeneratePairCode = async (req, res) => {
  try {
    const device = await KioskDevice.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Kiosk device not found" });
    }

    device.pairCode = generatePairCode();
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
// DELETE KIOSK
// =====================================================
export const deleteKioskDevice = async (req, res) => {
  try {
    const device = await KioskDevice.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Kiosk device not found" });
    }

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
