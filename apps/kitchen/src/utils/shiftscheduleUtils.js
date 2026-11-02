import API_BASE_URL from "../config/api";

// ------------------------------------------------------------------ API
// path is relative to /api/v1, e.g. "/shiftSchedule/summary". Returns the whole JSON envelope.
export const request = async (path, options = {}) => {
  const res = await fetch(`${API_BASE_URL}/v1${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Something went wrong");
  }
  return json;
};

const BASE = "/shiftSchedule";
export const api = (path, options) => request(`${BASE}${path}`, options);
export const post = (path, body = {}) => api(path, { method: "POST", body: JSON.stringify(body) });
export const put = (path, body = {}) => api(path, { method: "PUT", body: JSON.stringify(body) });
export const del = (path) => api(path, { method: "DELETE" });

export const query = (values) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) params.set(key, value);
  });
  return params.toString();
};

// ------------------------------------------------------------------ dates ("YYYY-MM-DD", hotel-local)
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const localToday = () => new Date().toLocaleDateString("en-CA");
const parseKey = (key) => new Date(`${key}T00:00:00Z`);
const toKey = (date) => date.toISOString().slice(0, 10);

export const addDays = (key, amount) => {
  const date = parseKey(key);
  date.setUTCDate(date.getUTCDate() + amount);
  return toKey(date);
};
export const weekdayOf = (key) => parseKey(key).getUTCDay();
export const mondayOf = (key) => addDays(key, -((weekdayOf(key) + 6) % 7));
export const eachDate = (from, to) => {
  const out = [];
  for (let key = from; key <= to; key = addDays(key, 1)) out.push(key);
  return out;
};
export const shiftMonth = (month, delta) => {
  const [year, number] = month.split("-").map(Number);
  return toKey(new Date(Date.UTC(year, number - 1 + delta, 1))).slice(0, 7);
};
export const monthLabel = (month) => {
  const [year, number] = month.split("-").map(Number);
  return `${MONTHS[number - 1]} ${year}`;
};
export const dayNumber = (key) => Number(key.slice(8));
export const formatLong = (key) => `${WEEKDAYS[weekdayOf(key)]}, ${dayNumber(key)} ${MONTHS[Number(key.slice(5, 7)) - 1].slice(0, 3)} ${key.slice(0, 4)}`;
export const formatShort = (key) => `${dayNumber(key)} ${MONTHS[Number(key.slice(5, 7)) - 1].slice(0, 3)}`;

// ------------------------------------------------------------------ shift time (live preview in the form)
const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};
export const to12h = (hhmm) => {
  if (!/^\d\d:\d\d$/.test(hhmm || "")) return "--:--";
  const [h, m] = hhmm.split(":").map(Number);
  return `${String(h % 12 === 0 ? 12 : h % 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
export const spanMinutes = (start, end) => {
  if (!start || !end) return 0;
  const gap = toMinutes(end) - toMinutes(start);
  return gap <= 0 ? gap + 1440 : gap;
};
export const hoursLabel = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} ${h === 1 ? "hr" : "hrs"}` : `${h}h ${String(m).padStart(2, "0")}m`;
};

export const SHIFT_COLORS = ["#22C55E", "#3B82F6", "#A855F7", "#F59E0B", "#EF4444", "#14B8A6"];

// ------------------------------------------------------------------ classes
// inputCls carries "w-full", which beats "w-auto" in Tailwind's CSS order. Use fieldCls for inline controls.
export const inputCls =
  "w-full rounded-lg border border-gray-700 bg-[#151515] px-3 py-2 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-emerald-400 [color-scheme:dark]";
export const fieldCls = inputCls.replace("w-full", "").trim();
export const labelCls = "text-[11px] font-medium text-gray-400";