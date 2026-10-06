import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";

// Atlas SRV lookups need public DNS (matches config/db.js).
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import Hotel from "#/modules/hotels/models/Hotel.js";
import Booking from "#/modules/bookings/models/Booking.js";
import CheckInSession from "#/modules/check-ins/models/CheckInSession.js";
import { createSessionToken } from "#/modules/check-ins/services/token.service.js";
import logger from "#/utils/logger.js";

const TEST_HOTEL_EMAIL = "test@hotelos.com";

const expiresAtFor = (reservation) => {
  const expiresAt = new Date(reservation.checkOut);
  expiresAt.setHours(23, 59, 59, 999);
  return expiresAt;
};

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  logger.info("Connected");

  const hotel = await Hotel.findOne({ email: TEST_HOTEL_EMAIL });
  if (!hotel) {
    throw new Error(
      "Test hotel not found — run `pnpm seed:guest -F backend` first",
    );
  }

  // Get all confirmed reservations for this hotel
  const reservations = await Booking.find({
    hotelId: hotel._id,
    status: { $in: ["confirmed", "reserved"] },
  })
    .populate("guestId", "name email phone nationality")
    .lean();

  if (reservations.length === 0) {
    logger.warn(
      "No confirmed reservations found to create check-in sessions for",
    );
    process.exit(0);
  }

  // Create check-in sessions for each reservation
  const statuses = [
    "link-sent",
    "in-progress",
    "submitted",
    "pending-verification",
    "approved",
    "rejected",
    "expired",
  ];

  for (const reservation of reservations) {
    // Skip if already has a check-in session
    const existingSession = await CheckInSession.findOne({
      reservationId: reservation._id,
    });
    if (existingSession) {
      logger.info(
        { reservationNo: reservation.reservationNo },
        "Check-in session already exists, skipping",
      );
      continue;
    }

    const { tokenHash } = createSessionToken();
    const expiresAt = expiresAtFor(reservation);

    // For demo purposes, create sessions with various statuses
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    const session = await CheckInSession.create({
      hotelId: hotel._id,
      reservationId: reservation._id,
      tokenHash,
      expiresAt,
      status: randomStatus,
      sentVia: "EMAIL",
      sentAt: new Date(
        Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      ),
      currentStep:
        randomStatus === "link-sent"
          ? 1
          : randomStatus === "in-progress"
            ? 3
            : 10,
      stepData: {},
      auditTrail: [
        {
          by: reservation.guestId,
          action: "link-sent",
          note: "Check-in link sent",
        },
      ],
    });

    logger.info(
      {
        reservationNo: reservation.reservationNo,
        sessionId: session._id,
        status: randomStatus,
      },
      "Created check-in session",
    );
  }

  logger.info("Check-in sessions seed complete");
  process.exit(0);
};

seed().catch((err) => {
  logger.error(err);
  process.exit(1);
});
