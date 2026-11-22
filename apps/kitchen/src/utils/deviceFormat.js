import {
  formatDate,
  formatTime,
  dateKeyOf,
  todayKey,
  addDays,
} from "./attendanceFormat.js";

export const TYPE_OPTIONS = [
  {
    value: "FACE_RECOGNITION",
    label: "Face Recognition",
    short: "Face",
    color: "#10b981",
  },
  {
    value: "FINGERPRINT",
    label: "Fingerprint",
    short: "Fingerprint",
    color: "#3b82f6",
  },
  { value: "RFID", label: "RFID", short: "RFID", color: "#a855f7" },
];

export const STATUS_OPTIONS = [
  { value: "ALL", label: "All Status" },
  { value: "ONLINE", label: "Online" },
  { value: "OFFLINE", label: "Offline" },
  { value: "WARNING", label: "Warning" },
];

export const STATUS_COLORS = {
  ONLINE: "#10b981",
  WARNING: "#f59e0b",
  OFFLINE: "#ef4444",
};

export const typeLabel = (type) =>
  TYPE_OPTIONS.find((item) => item.value === type)?.label || type;

export const COMMAND_LABELS = {
  TEST_CONNECTION: "Test connection",
  SYNC_NOW: "Sync",
  RESTART: "Restart",
};

export const formatLastSync = (instant) => {
  if (!instant) return "Never";
  const key = dateKeyOf(instant);
  const time = formatTime(instant);
  if (key === todayKey()) return `Today, ${time}`;
  if (key === addDays(todayKey(), -1)) return `Yesterday, ${time}`;
  return `${formatDate(key)}, ${time}`;
};

export const timeAgo = (instant, now = Date.now()) => {
  if (!instant) return "";
  const seconds = Math.max(
    0,
    Math.round((now - new Date(instant).getTime()) / 1000),
  );
  if (seconds < 45) return "just now";
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hr ago`;
  return `${Math.round(seconds / 86400)} days ago`;
};
