import express from "express";

import {
  createHotel,
  getHotels,
  getHotelById,
  updateHotelStatus,
  updateHotel,
  deleteHotel,
  getMyHotel,
  updateMyHotel,
  getAiosellRoomTypes,
  getChannelManagerConfig,
  updateChannelManagerConfig,
  getHotelAiosellCode,
  setHotelAiosellCode,
  getChannelApprovals,
  verifyChannelApproval,
  syncFromAiosell,
} from "../controllers/hotel.controller.js";

import { authenticate } from "#/shared/middleware/auth.middleware.js";

import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

// =====================================================
// SELF-SERVICE HOTEL DETAILS
// GET: SUB_ADMIN + RECEPTIONIST (read-only view for staff)
// PATCH: SUB_ADMIN only (only the hotel owner edits details)
// These must be registered before the SUPER_ADMIN gate.
// =====================================================

router.get(
  "/me",
  authenticate,
  authorize("SUB_ADMIN", "RECEPTIONIST"),
  getMyHotel,
);

router.patch("/me", authenticate, authorize("SUB_ADMIN"), updateMyHotel);

router.get(
  "/me/aiosell-room-types",
  authenticate,
  authorize("SUB_ADMIN", "RECEPTIONIST"),
  getAiosellRoomTypes,
);

// =====================================================
// ALL HOTEL MANAGEMENT IS SUPER ADMIN ONLY
// =====================================================

router.use(authenticate, authorize("SUPER_ADMIN"));

// =====================================================
// GET ALL HOTELS
// CREATE HOTEL
// =====================================================

router.route("/").get(getHotels).post(createHotel);

// =====================================================
// CHANNEL APPROVALS (SUPER_ADMIN) — MUST precede `/:hotelId`
// =====================================================

router.get("/channel-approvals", getChannelApprovals);
router.patch("/channel-approvals/:approvalId/verify", verifyChannelApproval);

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

router.patch("/:hotelId/status", updateHotelStatus);

// =====================================================
// CHANNEL MANAGER CONFIG (SUPER_ADMIN)
// =====================================================

router.get("/channel-manager/config", getChannelManagerConfig);
router.post("/channel-manager/config", updateChannelManagerConfig);
router.get("/:hotelId/aiosell-code", getHotelAiosellCode);
router.patch("/:hotelId/aiosell-code", setHotelAiosellCode);
router.post("/:hotelId/sync-from-aiosell", syncFromAiosell);

export default router;
