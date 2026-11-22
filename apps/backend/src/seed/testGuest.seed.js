import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";

// Atlas SRV lookups need public DNS (matches config/db.js).
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import Hotel from "#/modules/hotels/models/Hotel.js";
import Room from "#/modules/rooms/models/Room.js";
import User from "#/modules/users/models/User.js";
import Booking from "#/modules/bookings/models/Booking.js";
import { ACTIVE_STAY_STATUSES } from "#/modules/bookings/constants.js";
import FoodItem from "#/modules/food-items/models/FoodItem.js";
import logger from "#/utils/logger.js";

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  logger.info("Connected");

  let hotel = await Hotel.findOne({ email: "test@hotelos.com" });
  if (!hotel) {
    hotel = await Hotel.create({
      name: "Test Hotel",
      email: "test@hotelos.com",
      hotelCode: "TEST",
      checkInTime: "14:00",
      checkOutTime: "12:00",
      taxPercent: 12,
      gstin: "29AABCU9603R1ZM",
      address: "12, Residency Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      country: "India",
      currency: "INR",
      cancellationPolicy: "Free cancellation up to 24 hours prior to check-in.",
      termsAndConditions:
        "Valid government-issued photo ID is required upon check-in. The hotel reserves the right of admission.",
    });
  } else {
    let updated = false;
    if (!hotel.checkInTime) {
      hotel.checkInTime = "14:00";
      updated = true;
    }
    if (!hotel.checkOutTime) {
      hotel.checkOutTime = "12:00";
      updated = true;
    }
    if (hotel.taxPercent == null) {
      hotel.taxPercent = 12;
      updated = true;
    }
    if (!hotel.gstin) {
      hotel.gstin = "29AABCU9603R1ZM";
      updated = true;
    }
    if (!hotel.city) {
      hotel.city = "Bengaluru";
      updated = true;
    }
    if (!hotel.state) {
      hotel.state = "Karnataka";
      updated = true;
    }
    if (!hotel.pincode) {
      hotel.pincode = "560001";
      updated = true;
    }
    if (!hotel.termsAndConditions) {
      hotel.termsAndConditions =
        "Valid government-issued photo ID is required upon check-in. The hotel reserves the right of admission.";
      updated = true;
    }
    if (updated) {
      await hotel.save();
    }
  }

  if (!hotel.wifiNetworkName || !hotel.wifiPassword) {
    hotel.wifiNetworkName = "Grandview_204";
    hotel.wifiPassword = "Stay@204";
    await hotel.save();
    logger.info("WiFi credentials set on test hotel");
  }

  let room = await Room.findOne({ roomNumber: "204", hotelId: hotel._id });
  if (!room) {
    room = await Room.create({
      roomNumber: "204",
      type: "Deluxe",
      hotelId: hotel._id,
      status: "occupied",
      rate: 2000,
      floor: 2,
    });
  }

  let guest = await User.findOne({ username: "test-guest" });
  if (!guest) {
    guest = await User.create({
      name: "Aditya",
      username: "test-guest",
      password: "Guest@123",
      role: "GUEST",
      hotelId: hotel._id,
      email: "aditya@test.com",
      phone: "9876543210",
      address: "12, Residency Road",
      idType: "Aadhaar",
      idNumber: "1234-5678-9012",
      mustChangePassword: false,
    });

    await Booking.create({
      guestId: guest._id,
      hotelId: hotel._id,
      roomId: room._id,
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: "checked-in",
    });

    logger.info("Guest created — username: test-guest / password: Guest@123");
  }

  const activeBooking = await Booking.findOne({
    guestId: guest._id,
    status: { $in: ACTIVE_STAY_STATUSES },
  });

  if (!activeBooking) {
    await Booking.create({
      guestId: guest._id,
      hotelId: hotel._id,
      roomId: room._id,
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: "checked-in",
    });

    logger.info("Active test guest booking created");
  }

  const existingItems = await FoodItem.countDocuments({ hotelId: hotel._id });
  if (existingItems === 0) {
    await FoodItem.insertMany([
      {
        name: "Butter Chicken",
        price: 680,
        category: "Main Course",
        hotelId: hotel._id,
      },
      {
        name: "Veg Biryani",
        price: 360,
        category: "Main Course",
        hotelId: hotel._id,
      },
      {
        name: "Cold Coffee",
        price: 180,
        category: "Beverages",
        hotelId: hotel._id,
      },
    ]);
    logger.info("Sample food items created");
  }

  logger.info("Seed complete");
  process.exit(0);
};

seed().catch((err) => {
  logger.error(err);
  process.exit(1);
});
