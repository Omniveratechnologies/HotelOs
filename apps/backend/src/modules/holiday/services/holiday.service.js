import mongoose from "mongoose";
import { StaffDepartment } from "../../staff-management/models/staffManagement.js";
import { Holiday, HOLIDAY_TYPES } from "../models/Holiday.js";
import { ApiError, isObjectId } from "../../../utils/http.js";
import * as time from "../../../utils/attendanceTime.js";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MAX_LIMIT = 100;
const RECURRING_YEARS_AHEAD = 5;
const MAX_IMPORT = 200;
const SORT_KEYS = ["date", "name", "type"];

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toId = (value) => new mongoose.Types.ObjectId(String(value));
const weekdayOf = (key) => new Date(`${key}T00:00:00Z`).getUTCDay();
const dayDiff = (from, to) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86400000,
  );

export const NATIONAL_FIXED = [
  { name: "Republic Day", month: 1, day: 26, description: "National holiday" },
  {
    name: "Independence Day",
    month: 8,
    day: 15,
    description: "National holiday",
  },
  {
    name: "Gandhi Jayanti",
    month: 10,
    day: 2,
    description: "National holiday",
  },
  { name: "Christmas", month: 12, day: 25, description: "Christian holiday" },
];

const dateInYear = (year, month, day) => {
  const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return time.isDateKey(key) &&
    new Date(`${key}T00:00:00Z`).getUTCDate() === day
    ? key
    : null;
};

const sameDayInYear = (key, year) =>
  dateInYear(year, Number(key.slice(5, 7)), Number(key.slice(8, 10)));

const readInput = (body = {}, current = null) => {
  const pick = (key) => (body[key] !== undefined ? body[key] : current?.[key]);

  const name = String(pick("name") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 60)
    throw new ApiError(400, "Holiday name must be 2-60 characters.");

  const date = String(pick("date") ?? "").trim();
  if (
    !time.isDateKey(date) ||
    Number(date.slice(0, 4)) < 2000 ||
    Number(date.slice(0, 4)) > 2100
  ) {
    throw new ApiError(400, "Date must look like 2026-10-21 (year 2000-2100).");
  }

  const type = String(pick("type") ?? "CUSTOM").toUpperCase();
  if (!HOLIDAY_TYPES.includes(type))
    throw new ApiError(400, "Type must be NATIONAL or CUSTOM.");

  const description = String(pick("description") ?? "").trim();
  if (description.length > 200)
    throw new ApiError(400, "Description can be at most 200 characters.");

  const rawDepartments =
    body.departmentIds !== undefined
      ? body.departmentIds
      : current?.appliesToDepartments || [];
  if (!Array.isArray(rawDepartments))
    throw new ApiError(400, "Departments must be a list.");
  const departmentIds = [...new Set(rawDepartments.map(String))];
  if (departmentIds.some((id) => !isObjectId(id)))
    throw new ApiError(400, "Invalid department.");
  if (type === "NATIONAL" && departmentIds.length)
    throw new ApiError(400, "A national holiday applies to the whole hotel.");

  return {
    name,
    nameKey: name.toLowerCase(),
    date,
    type,
    description,
    isRecurring: Boolean(pick("isRecurring")),
    departmentIds,
    holidayDuty: Boolean(pick("holidayDuty")),
  };
};

const checkDepartments = async (hotelId, ids) => {
  if (!ids.length) return;
  const found = await StaffDepartment.countDocuments({
    hotelId,
    _id: { $in: ids.map(toId) },
  });
  if (found !== ids.length)
    throw new ApiError(400, "One of the departments was not found.");
};

const departmentMap = async (hotelId) =>
  new Map(
    (await StaffDepartment.find({ hotelId }).select("name").lean()).map(
      (row) => [String(row._id), row.name],
    ),
  );

const viewOf = (row, today, departments) => ({
  _id: row._id,
  name: row.name,
  date: row.date,
  day: WEEKDAYS[weekdayOf(row.date)],
  dayName: WEEKDAY_NAMES[weekdayOf(row.date)],
  type: row.type,
  status: row.date < today ? "COMPLETED" : "UPCOMING",
  isToday: row.date === today,
  daysAway: Math.max(0, dayDiff(today, row.date)),
  description: row.description || "",
  isRecurring: Boolean(row.isRecurring),
  seriesId: row.seriesId || null,
  holidayDuty: Boolean(row.holidayDuty),
  appliesToAll: !(row.appliesToDepartments || []).length,
  departments: (row.appliesToDepartments || []).map((id) => ({
    _id: id,
    name: departments.get(String(id)) || "Unknown",
  })),
});

const findHoliday = async (hotelId, id) => {
  if (!isObjectId(id)) throw new ApiError(400, "Invalid holiday ID.");
  const row = await Holiday.findOne({ _id: id, hotelId });
  if (!row) throw new ApiError(404, "Holiday not found.");
  return row;
};

const readYear = (value, today) => {
  if (value === undefined || value === "") return Number(today.slice(0, 4));
  const year = Number(value);
  if (!Number.isInteger(year) || year < 2000 || year > 2100)
    throw new ApiError(400, "Year must be between 2000 and 2100.");
  return year;
};

const dupMessage = (name, date) => `${name} is already on ${date}.`;

export const ensureRecurring = async (hotelId, throughYear) => {
  const rows = await Holiday.find({
    hotelId,
    isRecurring: true,
    seriesId: { $ne: null },
  })
    .sort({ date: 1 })
    .lean();
  const series = new Map();
  for (const row of rows) {
    const key = String(row.seriesId);
    if (!series.has(key)) series.set(key, { first: row, years: new Set() });
    series.get(key).years.add(Number(row.date.slice(0, 4)));
  }

  let created = 0;
  for (const { first, years } of series.values()) {
    for (
      let year = Number(first.date.slice(0, 4)) + 1;
      year <= throughYear;
      year += 1
    ) {
      if (years.has(year)) continue;
      const date = sameDayInYear(first.date, year);
      if (!date) continue;
      try {
        await Holiday.create({
          hotelId,
          name: first.name,
          nameKey: first.nameKey,
          date,
          type: first.type,
          description: first.description,
          isRecurring: true,
          seriesId: first.seriesId,
          appliesToDepartments: first.appliesToDepartments || [],
          holidayDuty: first.holidayDuty,
        });
        created += 1;
      } catch (error) {
        if (error?.code !== 11000) throw error;
      }
    }
  }
  return created;
};
export const listHolidays = async (hotelId, query = {}) => {
  const today = time.todayKey();
  const year = readYear(query.year, today);
  await ensureRecurring(hotelId, year);

  const type = String(query.type || "ALL").toUpperCase();
  const status = String(query.status || "ALL").toUpperCase();
  if (type !== "ALL" && !HOLIDAY_TYPES.includes(type))
    throw new ApiError(400, "Type must be ALL, NATIONAL or CUSTOM.");
  if (!["ALL", "UPCOMING", "COMPLETED"].includes(status))
    throw new ApiError(400, "Status must be ALL, UPCOMING or COMPLETED.");

  let from = `${year}-01-01`;
  let to = `${year}-12-31`;
  if (status === "UPCOMING" && today > from) from = today;
  if (status === "COMPLETED") {
    const yesterday = time.addDays(today, -1);
    if (yesterday < to) to = yesterday;
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || 10));
  const empty = {
    rows: [],
    pagination: { page, limit, total: 0, totalPages: 1 },
    year,
  };
  if (from > to) return empty;

  const filter = { hotelId, date: { $gte: from, $lte: to } };
  if (type !== "ALL") filter.type = type;
  const q = String(query.q || "").trim();
  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: pattern }, { description: pattern }];
  }

  const sortKey = SORT_KEYS.includes(query.sort) ? query.sort : "date";
  const sign = String(query.direction).toLowerCase() === "desc" ? -1 : 1;
  const sort =
    sortKey === "date"
      ? { date: sign, _id: sign }
      : { [sortKey]: sign, date: 1, _id: 1 };

  const [total, rows, departments] = await Promise.all([
    Holiday.countDocuments(filter),
    Holiday.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    departmentMap(hotelId),
  ]);

  return {
    year,
    rows: rows.map((row) => viewOf(row, today, departments)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};
export const summary = async (hotelId, query = {}) => {
  const today = time.todayKey();
  const year = readYear(query.year, today);
  await ensureRecurring(hotelId, year);

  const rows = await Holiday.find({
    hotelId,
    date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
  })
    .select("date type")
    .lean();
  const upcoming = rows.filter((row) => row.date >= today).length;
  const known = await Holiday.find({ hotelId }).select("date").lean();
  const thisYear = Number(today.slice(0, 4));
  const years = [
    ...new Set([
      thisYear - 1,
      thisYear,
      thisYear + 1,
      year,
      ...known.map((row) => Number(row.date.slice(0, 4))),
    ]),
  ].sort((a, b) => a - b);

  return {
    year,
    years,
    isCurrentYear: year === thisYear,
    stats: {
      total: rows.length,
      upcoming,
      past: rows.length - upcoming,
      custom: rows.filter((row) => row.type === "CUSTOM").length,
      national: rows.filter((row) => row.type === "NATIONAL").length,
    },
  };
};
export const upcoming = async (hotelId, query = {}) => {
  const today = time.todayKey();
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || 5));
  await ensureRecurring(hotelId, Number(today.slice(0, 4)) + 1);

  const horizon = time.addDays(today, 365);
  const filter = { hotelId, date: { $gte: today, $lte: horizon } };
  const [total, rows, departments] = await Promise.all([
    Holiday.countDocuments(filter),
    Holiday.find(filter).sort({ date: 1, _id: 1 }).limit(limit).lean(),
    departmentMap(hotelId),
  ]);
  return { total, rows: rows.map((row) => viewOf(row, today, departments)) };
};
export const calendar = async (hotelId, query = {}) => {
  const today = time.todayKey();
  const month = String(query.month || today.slice(0, 7)).trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw new ApiError(400, "Month must look like 2026-10.");
  await ensureRecurring(hotelId, Number(month.slice(0, 4)));

  const from = `${month}-01`;
  const next = new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 1),
  );
  const to = time.addDays(next.toISOString().slice(0, 10), -1);

  const rows = await Holiday.find({ hotelId, date: { $gte: from, $lte: to } })
    .sort({ date: 1, _id: 1 })
    .lean();
  const byDate = new Map();
  rows.forEach((row) =>
    byDate.set(row.date, [
      ...(byDate.get(row.date) || []),
      { _id: row._id, name: row.name, type: row.type },
    ]),
  );

  return {
    month,
    from,
    to,
    today,
    firstWeekday: weekdayOf(from),
    days: time.eachDate(from, to).map((date) => ({
      date,
      isToday: date === today,
      holidays: byDate.get(date) || [],
    })),
  };
};

export const getHoliday = async (hotelId, id) => {
  const row = await findHoliday(hotelId, id);
  return viewOf(
    row.toObject ? row.toObject() : row,
    time.todayKey(),
    await departmentMap(hotelId),
  );
};

const instanceDates = (date, recurring) => {
  const dates = [date];
  if (!recurring) return dates;
  const year = Number(date.slice(0, 4));
  for (let ahead = 1; ahead <= RECURRING_YEARS_AHEAD; ahead += 1) {
    const next = sameDayInYear(date, year + ahead);
    if (next) dates.push(next);
  }
  return dates;
};

const insertOne = async (hotelId, input, date, seriesId) => {
  if (await Holiday.findOne({ hotelId, date, nameKey: input.nameKey }).lean())
    throw new ApiError(409, dupMessage(input.name, date));
  try {
    return await Holiday.create({
      hotelId,
      name: input.name,
      nameKey: input.nameKey,
      date,
      type: input.type,
      description: input.description,
      isRecurring: input.isRecurring,
      seriesId,
      appliesToDepartments: input.departmentIds.map(toId),
      holidayDuty: input.holidayDuty,
    });
  } catch (error) {
    if (error?.code === 11000)
      throw new ApiError(409, dupMessage(input.name, date));
    throw error;
  }
};

// POST /holidays { name, date, type, description?, isRecurring?, departmentIds?, holidayDuty? }
export const createHoliday = async (hotelId, body) => {
  const input = readInput(body);
  await checkDepartments(hotelId, input.departmentIds);

  const seriesId = input.isRecurring ? new mongoose.Types.ObjectId() : null;
  const dates = instanceDates(input.date, input.isRecurring);
  const first = await insertOne(hotelId, input, dates[0], seriesId);

  for (const date of dates.slice(1)) {
    try {
      await insertOne(hotelId, input, date, seriesId);
    } catch (error) {
      if (error.status !== 409) throw error;
    }
  }
  return viewOf(first, time.todayKey(), await departmentMap(hotelId));
};

const futureOfSeries = (hotelId, row) =>
  Holiday.find({ hotelId, seriesId: row.seriesId, date: { $gt: row.date } });

// PUT /holidays/:id  { ...fields, applyToSeries? }
export const updateHoliday = async (hotelId, id, body = {}) => {
  const row = await findHoliday(hotelId, id);
  const today = time.todayKey();
  const current = row.toObject ? row.toObject() : { ...row };
  const input = readInput(body, current);
  await checkDepartments(hotelId, input.departmentIds);

  const passed = row.date < today;
  if (passed && input.date !== row.date)
    throw new ApiError(
      409,
      "This holiday has already passed, so its date can't be moved.",
    );
  if (!passed && input.date < today)
    throw new ApiError(
      400,
      "An upcoming holiday can't be moved to a past date.",
    );

  if (
    (input.date !== row.date || input.nameKey !== row.nameKey) &&
    (await Holiday.findOne({
      hotelId,
      date: input.date,
      nameKey: input.nameKey,
      _id: { $ne: row._id },
    }).lean())
  ) {
    throw new ApiError(409, dupMessage(input.name, input.date));
  }

  const apply = (target, date) => {
    Object.assign(target, {
      name: input.name,
      nameKey: input.nameKey,
      date,
      type: input.type,
      description: input.description,
      appliesToDepartments: input.departmentIds.map(toId),
      holidayDuty: input.holidayDuty,
    });
  };

  const wasRecurring = Boolean(row.isRecurring);
  const moved = input.date !== row.date;
  let series = [];
  if (wasRecurring && body.applyToSeries) {
    if (input.isRecurring) series = await futureOfSeries(hotelId, row);
    else
      await Holiday.deleteMany({
        hotelId,
        seriesId: row.seriesId,
        date: { $gt: row.date },
      });
  }

  try {
    for (const copy of series) {
      const date = moved
        ? sameDayInYear(input.date, Number(copy.date.slice(0, 4)))
        : copy.date;
      if (!date) continue;
      apply(copy, date);
      await copy.save();
    }
    apply(row, input.date);
    row.isRecurring = input.isRecurring;
    if (input.isRecurring && !row.seriesId)
      row.seriesId = new mongoose.Types.ObjectId();
    if (!input.isRecurring) row.seriesId = null;
    await row.save();
  } catch (error) {
    if (error?.code === 11000)
      throw new ApiError(409, dupMessage(input.name, input.date));
    throw error;
  }

  if (input.isRecurring && !wasRecurring) {
    for (const date of instanceDates(input.date, true).slice(1)) {
      try {
        await insertOne(hotelId, input, date, row.seriesId);
      } catch (error) {
        if (error.status !== 409) throw error;
      }
    }
  }

  return viewOf(
    row.toObject ? row.toObject() : row,
    today,
    await departmentMap(hotelId),
  );
};

// DELETE /holidays/:id?scope=this|series
export const deleteHoliday = async (hotelId, id, scope = "this") => {
  const row = await findHoliday(hotelId, id);
  if (row.date < time.todayKey())
    throw new ApiError(
      409,
      "This holiday has already passed, so it can't be deleted.",
    );

  let removed = 1;
  if (
    String(scope).toLowerCase() === "series" &&
    row.isRecurring &&
    row.seriesId
  ) {
    const result = await Holiday.deleteMany({
      hotelId,
      seriesId: row.seriesId,
      date: { $gte: row.date },
    });
    removed = result.deletedCount ?? 1;
  } else {
    await Holiday.deleteMany({ hotelId, _id: row._id });
  }
  return { removed };
};

// POST /holidays/import { holidays: [{ name, date, description?, type? }], type? }
export const importHolidays = async (hotelId, body = {}) => {
  if (!Array.isArray(body.holidays) || !body.holidays.length)
    throw new ApiError(400, "Send a list of holidays to import.");
  if (body.holidays.length > MAX_IMPORT)
    throw new ApiError(400, `Import at most ${MAX_IMPORT} holidays at a time.`);

  const result = { created: 0, skipped: [], errors: [] };
  for (const [index, item] of body.holidays.entries()) {
    try {
      const input = readInput({
        type: body.type || "NATIONAL",
        isRecurring: false,
        ...item,
        departmentIds: [],
      });
      await insertOne(hotelId, input, input.date, null);
      result.created += 1;
    } catch (error) {
      if (error.status === 409)
        result.skipped.push({
          row: index + 1,
          name: item?.name,
          date: item?.date,
          reason: "Already exists.",
        });
      else if (error.status === 400)
        result.errors.push({
          row: index + 1,
          name: item?.name,
          reason: error.message,
        });
      else throw error;
    }
  }
  return result;
};

// POST /holidays/seed-national { year? }
export const seedNational = async (hotelId, body = {}) => {
  const year = readYear(body.year, time.todayKey());
  const result = { created: 0, skipped: [] };
  for (const item of NATIONAL_FIXED) {
    const date = dateInYear(year, item.month, item.day);
    try {
      await createHoliday(hotelId, {
        name: item.name,
        date,
        type: "NATIONAL",
        description: item.description,
        isRecurring: true,
      });
      result.created += 1;
    } catch (error) {
      if (error.status !== 409) throw error;
      result.skipped.push(item.name);
    }
  }
  return result;
};
