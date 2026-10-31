import {
  request,
  todayKey,
  formatClockTime,
  fieldCls,
  inputCls,
  initialsOf,
} from "./dailyreportUtils.js";

export { request, todayKey, formatClockTime, fieldCls, inputCls, initialsOf };

export const DASHBOARD_PATH = "/manageStaffDashboard";
export const loadDashboard = (params, options) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v),
  ).toString();
  return request(`${DASHBOARD_PATH}?${qs}`, options);
};
export const ROUTES = {
  addStaff: "/manage-staff/staff-management/add-staff",
  registerFace: "/manage-staff/staff-management/add-staff",
  createDevice: "/manage-staff/device-kiosk/create-device",
  viewReports: "/manage-staff/reports/monthly-reports",
  attendanceHistory: "/manage-staff/attendance/attendance-history",
  devices: "/manage-staff/attendance/attendance-devices",
};

const TZ = import.meta.env?.VITE_HOTEL_TIMEZONE || "Asia/Kolkata";
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
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const weekdayOf = (key) =>
  WEEKDAY_SHORT[new Date(`${key}T00:00:00Z`).getUTCDay()];

export const formatLongDate = (key) =>
  key
    ? `${weekdayOf(key)}, ${Number(key.slice(8, 10))} ${MONTH_SHORT[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`
    : "-";

export const dayLabel = (key) => ({
  weekday: weekdayOf(key),
  day: Number(key.slice(8, 10)),
  short: `${Number(key.slice(8, 10))} ${MONTH_SHORT[Number(key.slice(5, 7)) - 1]}`,
});

export const greeting = (now = new Date()) => {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now),
  );
  return hour < 12
    ? "Good Morning"
    : hour < 17
      ? "Good Afternoon"
      : "Good Evening";
};

export const timeAgo = (value, now = Date.now()) => {
  if (!value) return "Never seen";
  const seconds = Math.max(
    0,
    Math.round((now - new Date(value).getTime()) / 1000),
  );
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export const adminName = () => {
  try {
    for (const key of ["user", "admin", "authUser"]) {
      const user = JSON.parse(localStorage.getItem(key) || "null");
      const name = user?.name || user?.fullName;
      if (name) return String(name).split(" ")[0];
    }
  } catch {}
  return "Admin";
};

export const formatNumber = (value) =>
  value === null || value === undefined
    ? "-"
    : Number(value).toLocaleString("en-IN");

export const OVERVIEW_PARTS = [
  ["present", "Present", "#22c55e"],
  ["late", "Late", "#f59e0b"],
  ["absent", "Absent", "#ef4444"],
  ["onLeave", "On Leave", "#8b5cf6"],
];

export const displayStatus = (row) =>
  row.status === "PRESENT" && row.checkInAt && !row.checkOutAt
    ? "WORKING"
    : row.status;

export const STATUS_LOOK = {
  PRESENT: {
    label: "Present",
    tone: "border-green-500/30 bg-green-500/10 text-green-400",
    dot: "#22c55e",
  },
  WORKING: {
    label: "Working",
    tone: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dot: "#f59e0b",
  },
  LATE: {
    label: "Late",
    tone: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    dot: "#f97316",
  },
  ABSENT: {
    label: "Absent",
    tone: "border-red-500/30 bg-red-500/10 text-red-400",
    dot: "#ef4444",
  },
  EARLY_LEAVE: {
    label: "Early Leave",
    tone: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    dot: "#a855f7",
  },
  ON_LEAVE: {
    label: "On Leave",
    tone: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    dot: "#3b82f6",
  },
  HOLIDAY: {
    label: "Holiday",
    tone: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    dot: "#06b6d4",
  },
};
