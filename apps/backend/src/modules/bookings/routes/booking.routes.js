import express from "express";
import {
  createReservation,
  getQuote,
  getAvailability,
  getAvailableRooms,
  getBookings,
  getBookingStats,
  getBookingById,
  updateBooking,
  cancelBooking,
  reconfirmBooking,
  changeBookingRoom,
  extendBookingStay,
  getBookingHistory,
  deleteBooking,
} from "../controllers/booking.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

// Booking (guest stay) management — admin-scoped
router.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST"));

// Static paths before /:id
router.post("/quote", getQuote);
router.get("/availability", getAvailability);
router.get("/available-rooms", getAvailableRooms);
router.get("/stats", getBookingStats);

router.get("/", getBookings);

router.post("/", createReservation);

router.get("/:id", getBookingById);

router.patch("/:id", updateBooking);

router.post("/:id/cancel", cancelBooking);
router.post("/:id/reconfirm", reconfirmBooking);
router.post("/:id/change-room", changeBookingRoom);
router.post("/:id/extend-stay", extendBookingStay);
router.get("/:id/history", getBookingHistory);

router.delete("/:id", deleteBooking);

export default router;
