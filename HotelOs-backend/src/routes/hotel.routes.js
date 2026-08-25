import express from "express";

import {
  createHotel,
  getHotels,
  getHotelById,
  updateHotelStatus,
  updateHotel,
  deleteHotel,
} from "../controllers/hotel.controller.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import {
  authorize,
} from "../middleware/role.middleware.js";

const router = express.Router();

// =====================================================
// ALL HOTEL MANAGEMENT IS SUPER ADMIN ONLY
// =====================================================

router.use(
  authenticate,
  authorize("SUPER_ADMIN")
);

// =====================================================
// GET ALL HOTELS
// CREATE HOTEL
// =====================================================

router
  .route("/")
  .get(getHotels)
  .post(createHotel);

// =====================================================
// GET SINGLE HOTEL
// UPDATE HOTEL DETAILS
// DELETE HOTEL
// =====================================================

router
  .route("/:hotelId")
  .get(getHotelById)
  .patch(updateHotel)
  .delete(deleteHotel);

// =====================================================
// ACTIVATE / DEACTIVATE HOTEL
// =====================================================

router.patch(
  "/:hotelId/status",
  updateHotelStatus
);

export default router;