import "dotenv/config";
import mongoose from "mongoose";
import Hotel from "#/modules/hotels/models/Hotel.js";
import KioskDevice from "#/modules/kiosks/models/KioskDevice.js";
import logger from "#/utils/logger.js";

const seedKioskDevices = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("MongoDB connected for Kiosk seeding");

    const hotel = await Hotel.findOne({ isActive: true });
    if (!hotel) {
      logger.warn("No active hotel found. Please seed hotels first.");
      process.exit(0);
    }

    const existingKiosk = await KioskDevice.findOne({
      deviceId: "KIOSK-LOBBY-01",
    });
    if (existingKiosk) {
      logger.info(
        { deviceId: existingKiosk.deviceId },
        "Kiosk device already exists",
      );
      process.exit(0);
    }

    const kiosk = await KioskDevice.create({
      hotelId: hotel._id,
      deviceId: "KIOSK-LOBBY-01",
      name: "Main Lobby Terminal #1",
      location: "Main Lobby - East Entrance",
      status: "ONLINE",
      targetDashboard: "DEMO_URL",
      assignedUrl:
        process.env.KIOSK_DEMO_URL || "https://example.com/demo-kiosk",
      pairCode: "123456",
      isPaired: false,
      firmwareVersion: "v1.4.0",
      appVersion: "1.0.0",
      supportedFeatures: ["CHECK_IN", "KEY_DISPENSE", "DOCUMENT_SCAN"],
      isActive: true,
    });

    logger.info(
      {
        id: kiosk._id,
        deviceId: kiosk.deviceId,
        pairCode: kiosk.pairCode,
        hotel: hotel.name,
      },
      "Demo kiosk seeded successfully with pair code 123456",
    );

    process.exit(0);
  } catch (error) {
    logger.error(error, "Failed to seed Kiosk Devices");
    process.exit(1);
  }
};

seedKioskDevices();
