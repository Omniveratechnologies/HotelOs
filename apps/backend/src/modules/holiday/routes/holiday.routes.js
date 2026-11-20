import { Router } from "express";
import {
  listHolidays,
  summary,
  upcoming,
  calendar,
  getHoliday,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  importHolidays,
  seedNational,
} from "../controllers/holiday.controller.js";
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  createHolidayBodySchema,
  updateHolidayBodySchema,
  listHolidaysQuerySchema,
  summaryQuerySchema,
  upcomingQuerySchema,
  calendarQuerySchema,
  importHolidaysBodySchema,
  seedNationalBodySchema,
  holidayIdParamsSchema,
} from "../schemas.js";

const holidayRoutes = Router();

holidayRoutes.get(
  "/",
  validate({ query: listHolidaysQuerySchema }),
  listHolidays,
);
holidayRoutes.get("/summary", validate({ query: summaryQuerySchema }), summary);
holidayRoutes.get(
  "/upcoming",
  validate({ query: upcomingQuerySchema }),
  upcoming,
);
holidayRoutes.get(
  "/calendar",
  validate({ query: calendarQuerySchema }),
  calendar,
);
holidayRoutes.post(
  "/import",
  validate({ body: importHolidaysBodySchema }),
  importHolidays,
);
holidayRoutes.post(
  "/seed-national",
  validate({ body: seedNationalBodySchema }),
  seedNational,
);

holidayRoutes.post(
  "/",
  validate({ body: createHolidayBodySchema }),
  createHoliday,
);
holidayRoutes.get(
  "/:id",
  validate({ params: holidayIdParamsSchema }),
  getHoliday,
);
holidayRoutes.put(
  "/:id",
  validate({ params: holidayIdParamsSchema, body: updateHolidayBodySchema }),
  updateHoliday,
);
holidayRoutes.delete(
  "/:id",
  validate({ params: holidayIdParamsSchema }),
  deleteHoliday,
);

export default holidayRoutes;
