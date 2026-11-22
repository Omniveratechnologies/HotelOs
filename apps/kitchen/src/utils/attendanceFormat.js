export const HOTEL_TIMEZONE =
  import.meta.env?.VITE_HOTEL_TIMEZONE || "Asia/Kolkata";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const zoneParts = (instant, tz = HOTEL_TIMEZONE) => {
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
  }).formatToParts(new Date(instant))) {
    out[part.type] = part.value;
  }
  return out;
};

export const dateKeyOf = (instant, tz = HOTEL_TIMEZONE) => {
  const p = zoneParts(instant, tz);
  return `${p.year}-${p.month}-${p.day}`;
};

export const todayKey = () => dateKeyOf(new Date());

export const monthStartKey = () => `${todayKey().slice(0, 7)}-01`;

export const addDays = (key, days) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

export const formatDate = (key) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(key ?? ""))) return "-";
  const [y, m, d] = key.split("-");
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
};

export const formatTime = (instant) => {
  if (!instant) return "-";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: HOTEL_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(instant))
    .replace(/^(\d):/, "0$1:");
};

const offsetAt = (utcMs, tz) => {
  const whole = Math.floor(utcMs / 1000) * 1000;
  const p = zoneParts(whole, tz);
  return (
    Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) -
    whole
  );
};

export const wallTimeToInstant = (dateKey, hhmm, tz = HOTEL_TIMEZONE) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  const first = guess - offsetAt(guess, tz);
  return new Date(guess - offsetAt(first, tz));
};

export const toInputValue = (instant) => {
  if (!instant) return "";
  const p = zoneParts(instant);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};

export const fromInputValue = (value) => {
  if (!value) return null;
  const [date, time] = value.split("T");
  return wallTimeToInstant(date, time).toISOString();
};

export const formatMinutes = (minutes) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, "0")}m`;
};

export const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-US");
