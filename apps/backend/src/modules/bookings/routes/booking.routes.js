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
import { validate } from "#/shared/middleware/validate.middleware.js";

import {
  getArrivals,
  getDepartures,
  getFrontDeskStats,
  checkInBooking,
  checkOutBooking,
  getBookingFolio,
} from "../controllers/frontDesk.controller.js";

import {
  createReservationBodySchema,
  getQuoteBodySchema,
  getAvailabilityQuerySchema,
  getAvailableRoomsQuerySchema,
  getBookingStatsQuerySchema,
  getBookingsQuerySchema,
  updateBookingBodySchema,
  cancelBookingBodySchema,
  reconfirmBookingBodySchema,
  changeBookingRoomBodySchema,
  extendBookingStayBodySchema,
  checkInBookingBodySchema,
  checkOutBookingBodySchema,
  getArrivalsQuerySchema,
  getDeparturesQuerySchema,
  getFrontDeskStatsQuerySchema,
  getBookingFolioParamsSchema,
  bookingIdParamsSchema,
} from "../schemas.js";

const router = express.Router();

// Booking (guest stay) management — admin-scoped
router.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST"));

// Front Desk Operations endpoints
router.get(
  "/front-desk/arrivals",
  validate({ query: getArrivalsQuerySchema }),
  getArrivals,
);
router.get(
  "/front-desk/departures",
  validate({ query: getDeparturesQuerySchema }),
  getDepartures,
);
router.get(
  "/front-desk/stats",
  validate({ query: getFrontDeskStatsQuerySchema }),
  getFrontDeskStats,
);
router.get(
  "/:id/folio",
  validate({ params: getBookingFolioParamsSchema }),
  getBookingFolio,
);
router.post(
  "/:id/check-in",
  validate({ params: bookingIdParamsSchema, body: checkInBookingBodySchema }),
  checkInBooking,
);
router.post(
  "/:id/check-out",
  validate({ params: bookingIdParamsSchema, body: checkOutBookingBodySchema }),
  checkOutBooking,
);
router.post(
  "/:id/express-check-in",
  validate({ params: bookingIdParamsSchema, body: checkInBookingBodySchema }),
  checkInBooking,
);

// Static paths before /:id
router.post("/quote", validate({ body: getQuoteBodySchema }), getQuote);
router.get(
  "/availability",
  validate({ query: getAvailabilityQuerySchema }),
  getAvailability,
);
router.get(
  "/available-rooms",
  validate({ query: getAvailableRoomsQuerySchema }),
  getAvailableRooms,
);
router.get(
  "/stats",
  validate({ query: getBookingStatsQuerySchema }),
  getBookingStats,
);

router.get("/", validate({ query: getBookingsQuerySchema }), getBookings);

router.post(
  "/",
  validate({ body: createReservationBodySchema }),
  createReservation,
);

router.get("/:id", validate({ params: bookingIdParamsSchema }), getBookingById);

router.patch(
  "/:id",
  validate({ params: bookingIdParamsSchema, body: updateBookingBodySchema }),
  updateBooking,
);

router.post(
  "/:id/cancel",
  validate({ params: bookingIdParamsSchema, body: cancelBookingBodySchema }),
  cancelBooking,
);
router.post(
  "/:id/reconfirm",
  validate({ params: bookingIdParamsSchema, body: reconfirmBookingBodySchema }),
  reconfirmBooking,
);
router.post(
  "/:id/change-room",
  validate({
    params: bookingIdParamsSchema,
    body: changeBookingRoomBodySchema,
  }),
  changeBookingRoom,
);
router.post(
  "/:id/extend-stay",
  validate({
    params: bookingIdParamsSchema,
    body: extendBookingStayBodySchema,
  }),
  extendBookingStay,
);
router.get(
  "/:id/history",
  validate({ params: bookingIdParamsSchema }),
  getBookingHistory,
);

router.delete(
  "/:id",
  validate({ params: bookingIdParamsSchema }),
  deleteBooking,
);

export default router;
