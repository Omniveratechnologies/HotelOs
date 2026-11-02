import API_BASE_URL from "../config/api";

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

export const REPORTS_BASE = "/staffReports";
export const api = (path, options) =>
  request(`${REPORTS_BASE}${path}`, options);

export const query = (values) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined)
      params.set(key, value);
  });
  return params.toString();
};

const TZ = import.meta.env?.VITE_HOTEL_TIMEZONE || "Asia/Kolkata";
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

export const todayKey = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: TZ });

export const formatDateKey = (key) =>
  key
    ? `${key.slice(8, 10)} ${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`
    : "-";

export const formatClockTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

export const percentText = (value) =>
  value === null || value === undefined ? "-" : `${Number(value).toFixed(1)}%`;

export const STATUS_LABEL = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EARLY_LEAVE: "Early Leave",
  ON_LEAVE: "On Leave",
  HOLIDAY: "Holiday",
  NOT_MARKED: "Not Marked",
};
export const STATUS_COLOR = {
  PRESENT: "#22c55e",
  ABSENT: "#ef4444",
  LATE: "#a855f7",
  EARLY_LEAVE: "#f59e0b",
  ON_LEAVE: "#3b82f6",
  HOLIDAY: "#06b6d4",
  NOT_MARKED: "#6b7280",
};
export const STATUS_OPTIONS = [
  "PRESENT",
  "LATE",
  "EARLY_LEAVE",
  "ABSENT",
  "ON_LEAVE",
  "HOLIDAY",
];

export const inputCls =
  "w-full rounded-lg border border-gray-700 bg-[#151515] px-3 py-2 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 [color-scheme:dark]";
export const fieldCls = inputCls.replace("w-full", "").trim();

const csvCell = (value) => {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const toCsv = (rows) => {
  const head = [
    "#",
    "Staff",
    "Staff ID",
    "Department",
    "Designation",
    "Date",
    "Check In",
    "Check Out",
    "Work Hours",
    "Status",
    "Device",
  ];
  const lines = rows.map((row, i) =>
    [
      i + 1,
      row.staff.name,
      row.staff.staffCode,
      row.department?.name || "-",
      row.designation?.name || "-",
      row.date,
      formatClockTime(row.checkInAt),
      formatClockTime(row.checkOutAt),
      row.workingHours,
      STATUS_LABEL[row.status] || row.status,
      row.device?.name || "-",
    ]
      .map(csvCell)
      .join(","),
  );
  return `﻿${[head.map(csvCell).join(","), ...lines].join("\r\n")}\r\n`;
};

export const downloadText = (
  filename,
  text,
  type = "text/csv;charset=utf-8",
) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
