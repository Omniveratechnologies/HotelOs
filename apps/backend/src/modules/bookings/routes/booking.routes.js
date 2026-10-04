import express from "express";
import {
  createReservation,
  getQuote,
  getAvailability,
  getBookings,
  getBookingById,
  updateBooking,
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

router.get("/", getBookings);

router.post("/", createReservation);

router.get("/:id", getBookingById);

router.patch("/:id", updateBooking);

router.delete("/:id", deleteBooking);

export default router;
