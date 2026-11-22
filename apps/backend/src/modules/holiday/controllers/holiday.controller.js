import { getHotelId, route } from "../../../utils/http.js";
import * as service from "../services/holiday.service.js";

// GET /holidays?year=&type=&status=&q=&sort=&direction=&page=&limit=
export const listHolidays = route(async (req, res) => {
  const { rows, pagination, year } = await service.listHolidays(
    getHotelId(req),
    req.query,
  );
  res.json({ success: true, data: rows, pagination, year });
});

// GET /holidays/summary?year=
export const summary = route(async (req, res) => {
  res.json({
    success: true,
    data: await service.summary(getHotelId(req), req.query),
  });
});

// GET /holidays/upcoming?limit=5
export const upcoming = route(async (req, res) => {
  const { rows, total } = await service.upcoming(getHotelId(req), req.query);
  res.json({ success: true, data: rows, total });
});

// GET /holidays/calendar?month=2026-10
export const calendar = route(async (req, res) => {
  res.json({
    success: true,
    data: await service.calendar(getHotelId(req), req.query),
  });
});

// GET /holidays/:id
export const getHoliday = route(async (req, res) => {
  res.json({
    success: true,
    data: await service.getHoliday(getHotelId(req), req.params.id),
  });
});

// POST /holidays { name, date, type, description?, isRecurring?, departmentIds?, holidayDuty? }
export const createHoliday = route(async (req, res) => {
  const data = await service.createHoliday(getHotelId(req), req.body);
  res.status(201).json({ success: true, message: "Holiday added.", data });
});

// PUT /holidays/:id { ...fields, applyToSeries? }
export const updateHoliday = route(async (req, res) => {
  const data = await service.updateHoliday(
    getHotelId(req),
    req.params.id,
    req.body,
  );
  res.json({ success: true, message: "Holiday updated.", data });
});

// DELETE /holidays/:id?scope=this|series
export const deleteHoliday = route(async (req, res) => {
  const data = await service.deleteHoliday(
    getHotelId(req),
    req.params.id,
    req.query.scope,
  );
  res.json({ success: true, message: "Holiday deleted.", data });
});

// POST /holidays/import { holidays: [{ name, date, description? }], type? }
export const importHolidays = route(async (req, res) => {
  const data = await service.importHolidays(getHotelId(req), req.body);
  res.json({
    success: true,
    message: `${data.created} holiday${data.created === 1 ? "" : "s"} imported.`,
    data,
  });
});

// POST /holidays/seed-national { year? }
export const seedNational = route(async (req, res) => {
  const data = await service.seedNational(getHotelId(req), req.body);
  res.json({
    success: true,
    message: `${data.created} national holiday${data.created === 1 ? "" : "s"} added.`,
    data,
  });
});
