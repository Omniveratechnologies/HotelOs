export const hotelTimezone = () => process.env.HOTEL_TIMEZONE || "Asia/Kolkata";

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isDateKey = (value) => {
  if (!DATE_RE.test(String(value ?? ""))) return false;
  const [y, m, d] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  return (
    probe.getUTCFullYear() === y &&
    probe.getUTCMonth() === m - 1 &&
    probe.getUTCDate() === d
  );
};

const parts = (date, tz) => {
  const out = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date)) {
    out[part.type] = part.value;
  }
  return out;
};

export const dateKeyOf = (instant, tz = hotelTimezone()) => {
  const p = parts(new Date(instant), tz);
  return `${p.year}-${p.month}-${p.day}`;
};

export const todayKey = (tz = hotelTimezone(), now = new Date()) =>
  dateKeyOf(now, tz);

export const addDays = (key, days) => {
  const [y, m, d] = key.split("-").map(Number);
  const moved = new Date(Date.UTC(y, m - 1, d + days));
  return moved.toISOString().slice(0, 10);
};

export const eachDate = (from, to) => {
  const out = [];
  for (let key = from; key <= to; key = addDays(key, 1)) out.push(key);
  return out;
};

export const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};

export const isTime = (value) => TIME_RE.test(String(value ?? ""));

export const minutesOfDay = (instant, tz = hotelTimezone()) => {
  const p = parts(new Date(instant), tz);
  return Number(p.hour) * 60 + Number(p.minute);
};

export const crossesMidnight = (start, end) =>
  toMinutes(end) <= toMinutes(start);

const offsetAt = (utcMs, tz) => {
  const whole = Math.floor(utcMs / 1000) * 1000;
  const p = parts(new Date(whole), tz);
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return asUtc - whole;
};

export const wallTimeToInstant = (dateKey, hhmm, tz = hotelTimezone()) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  const first = guess - offsetAt(guess, tz);
  return new Date(guess - offsetAt(first, tz));
};

export const shiftWindow = (dateKey, shift, tz = hotelTimezone()) => {
  const start = wallTimeToInstant(dateKey, shift.startTime, tz);
  const endDay = crossesMidnight(shift.startTime, shift.endTime)
    ? addDays(dateKey, 1)
    : dateKey;
  return { start, end: wallTimeToInstant(endDay, shift.endTime, tz) };
};

export const formatMinutes = (minutes) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, "0")}m`;
};
