import API_BASE_URL from "../config/api";
import {
  REPORTS_BASE,
  api,
  query,
  request,
  todayKey,
  fieldCls,
  inputCls,
  initialsOf,
  percentText,
} from "./dailyreportUtils.js";

export {
  REPORTS_BASE,
  api,
  query,
  request,
  todayKey,
  fieldCls,
  inputCls,
  initialsOf,
  percentText,
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_SHORT = [
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

export const currentMonthKey = () => todayKey().slice(0, 7);

export const formatMonthLabel = (key) =>
  key ? `${MONTH_NAMES[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}` : "-";

export const formatDayMonth = (key) =>
  key
    ? `${Number(key.slice(8, 10))} ${MONTH_SHORT[Number(key.slice(5, 7)) - 1]}`
    : "-";

export const formatCount = (value) =>
  value === null || value === undefined
    ? "-"
    : Number(value).toLocaleString("en-IN");

export const MONTHLY_COLOR = {
  PRESENT: "#22c55e",
  ABSENT: "#ef4444",
  LATE: "#a855f7",
  ON_LEAVE: "#3b82f6",
  HALF_DAY: "#f59e0b",
  HOLIDAY: "#06b6d4",
};
export const MONTHLY_LABEL = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  ON_LEAVE: "On Leave",
  HALF_DAY: "Half Day",
  HOLIDAY: "Holiday",
};
export const MONTHLY_STATUS_OPTIONS = [
  "PRESENT",
  "LATE",
  "HALF_DAY",
  "ABSENT",
  "ON_LEAVE",
];

export const BAND_COLOR = {
  GOOD: "#22c55e",
  WARNING: "#f59e0b",
  POOR: "#ef4444",
};
export const BAND_LABEL = {
  GOOD: "Good",
  WARNING: "Needs attention",
  POOR: "Poor",
};
export const bandColor = (band) => BAND_COLOR[band] || "#6b7280";

export const trendText = (metric) => {
  if (!metric || metric.trend === null || metric.trend === undefined)
    return "No data for last month";
  const arrow =
    metric.trend === "UP" ? "↑" : metric.trend === "DOWN" ? "↓" : "→";
  if (metric.change === null || metric.change === undefined)
    return `${arrow} New since last month`;
  const size = Math.abs(metric.change);
  return `${arrow} ${size}${metric.unit === "points" ? " pts" : "%"} from last month`;
};

export const downloadFromApi = async (path, fallbackName) => {
  const res = await fetch(`${API_BASE_URL}/v1${REPORTS_BASE}${path}`);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || "Could not export the report");
  }
  const disposition = res.headers.get("Content-Disposition") || "";
  const filename =
    /filename="?([^";]+)"?/i.exec(disposition)?.[1] || fallbackName;

  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
};

const DEVICE_PATHS = [
  "/staffManagement/attendance/devices",
  "/attendance/devices",
  "/devices",
];

export const loadDeviceOptions = async () => {
  for (const base of DEVICE_PATHS) {
    const list = [];
    try {
      for (let page = 1; page <= 50; page += 1) {
        const res = await request(`${base}?page=${page}&limit=100`);
        const batch = Array.isArray(res.data)
          ? res.data
          : res.data?.devices || [];
        list.push(...batch);
        const totalPages =
          res.pagination?.totalPages ?? res.meta?.totalPages ?? 1;
        if (page >= totalPages || batch.length === 0) break;
      }
    } catch {
      continue;
    }
    const seen = new Set();
    return list
      .filter((d) => d._id && !seen.has(d._id) && seen.add(d._id))
      .map((d) => ({
        _id: d._id,
        name: d.name || d.deviceName || d.code || "Device",
      }));
  }
  return [];
};
