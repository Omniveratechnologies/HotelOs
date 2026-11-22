import API_BASE_URL from "../config/api";

// ------------------------------------------------------------------ API
// path is relative to /api/v1, e.g. "/holidays/summary". Returns the whole JSON envelope.
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

const BASE = "/holidays"; // app.use("/api/v1/holidays", holidayRoutes)
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

// ------------------------------------------------------------------ dates ("YYYY-MM-DD")
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
export const shiftMonth = (month, delta) => {
  const [year, number] = month.split("-").map(Number);
  return toKey(new Date(Date.UTC(year, number - 1 + delta, 1))).slice(0, 7);
};
export const monthLabel = (month) => {
  const [year, number] = month.split("-").map(Number);
  return `${MONTHS[number - 1]} ${year}`;
};
export const dayNumber = (key) => Number(key.slice(8));
// "26 Jan 2026"
export const formatDate = (key) => (key ? `${dayNumber(key)} ${MONTHS[Number(key.slice(5, 7)) - 1].slice(0, 3)} ${key.slice(0, 4)}` : "-");

// ------------------------------------------------------------------ classes
// inputCls carries "w-full", which beats "w-auto" in Tailwind's CSS order. Use fieldCls for inline controls.
export const inputCls =
  "w-full rounded-lg border border-gray-700 bg-[#151515] px-3 py-2 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 [color-scheme:dark]";
export const fieldCls = inputCls.replace("w-full", "").trim();
export const labelCls = "text-[11px] font-medium text-gray-400";

export const TYPE_COLORS = { NATIONAL: "#3B82F6", CUSTOM: "#A855F7" };