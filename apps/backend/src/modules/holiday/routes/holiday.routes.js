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

const holidayRoutes = Router();

holidayRoutes.get("/", listHolidays);
holidayRoutes.get("/summary", summary);
holidayRoutes.get("/upcoming", upcoming);
holidayRoutes.get("/calendar", calendar);
holidayRoutes.post("/import", importHolidays);
holidayRoutes.post("/seed-national", seedNational);

holidayRoutes.post("/", createHoliday);
holidayRoutes.get("/:id", getHoliday);
holidayRoutes.put("/:id", updateHoliday);
holidayRoutes.delete("/:id", deleteHoliday);

export default holidayRoutes;
