import "dotenv/config";
import mongoose from "mongoose";
import Hotel from "#/modules/hotels/models/Hotel.js";
import Room from "#/modules/rooms/models/Room.js";
import User from "#/modules/users/models/User.js";
import FoodItem from "#/modules/food-items/models/FoodItem.js";

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");

  let hotel = await Hotel.findOne({ email: "test@hotelos.com" });
  if (!hotel) {
    hotel = await Hotel.create({
      name: "Test Hotel",
      email: "test@hotelos.com",
      hotelCode: "TEST",
    });
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
      roomId: room._id,
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      mustChangePassword: false,
    });
    console.log("Guest created — username: test-guest / password: Guest@123");
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
    console.log("Sample food items created");
  }

  console.log("Seed complete");
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
