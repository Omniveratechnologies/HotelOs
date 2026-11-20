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
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  createHotelBodySchema,
  updateHotelBodySchema,
  updateHotelStatusBodySchema,
  updateMyHotelBodySchema,
  updateChannelManagerConfigBodySchema,
  setHotelAiosellCodeBodySchema,
  hotelIdParamsSchema,
  approvalIdParamsSchema,
  channelApprovalsQuerySchema,
  syncFromAiosellParamsSchema,
} from "../schemas.js";

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

router.patch(
  "/me",
  authenticate,
  authorize("SUB_ADMIN"),
  validate({ body: updateMyHotelBodySchema }),
  updateMyHotel,
);

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

router
  .route("/")
  .get(getHotels)
  .post(validate({ body: createHotelBodySchema }), createHotel);

// =====================================================
// CHANNEL APPROVALS (SUPER_ADMIN) — MUST precede `/:hotelId`
// =====================================================

router.get(
  "/channel-approvals",
  validate({ query: channelApprovalsQuerySchema }),
  getChannelApprovals,
);
router.patch(
  "/channel-approvals/:approvalId/verify",
  validate({ params: approvalIdParamsSchema }),
  verifyChannelApproval,
);

// =====================================================
// GET SINGLE HOTEL
// UPDATE HOTEL DETAILS
// DELETE HOTEL
// =====================================================

router
  .route("/:hotelId")
  .get(validate({ params: hotelIdParamsSchema }), getHotelById)
  .patch(
    validate({ params: hotelIdParamsSchema, body: updateHotelBodySchema }),
    updateHotel,
  )
  .delete(validate({ params: hotelIdParamsSchema }), deleteHotel);

// =====================================================
// ACTIVATE / DEACTIVATE HOTEL
// =====================================================

router.patch(
  "/:hotelId/status",
  validate({ params: hotelIdParamsSchema, body: updateHotelStatusBodySchema }),
  updateHotelStatus,
);

// =====================================================
// CHANNEL MANAGER CONFIG (SUPER_ADMIN)
// =====================================================

router.get("/channel-manager/config", getChannelManagerConfig);
router.post(
  "/channel-manager/config",
  validate({ body: updateChannelManagerConfigBodySchema }),
  updateChannelManagerConfig,
);
router.get(
  "/:hotelId/aiosell-code",
  validate({ params: hotelIdParamsSchema }),
  getHotelAiosellCode,
);
router.patch(
  "/:hotelId/aiosell-code",
  validate({
    params: hotelIdParamsSchema,
    body: setHotelAiosellCodeBodySchema,
  }),
  setHotelAiosellCode,
);
router.post(
  "/:hotelId/sync-from-aiosell",
  validate({ params: syncFromAiosellParamsSchema }),
  syncFromAiosell,
);

export default router;
