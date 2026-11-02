import {
  FiCalendar,
  FiClock,
  FiFileText,
  FiSmartphone,
  FiUsers,
} from "react-icons/fi";
import { FaFileCsv, FaFileExcel, FaFilePdf, FaPrint } from "react-icons/fa";

export const REPORT_TYPES = [
  {
    value: "ATTENDANCE",
    label: "Attendance Report",
    description: "Check-in, check-out, work hours, present/absent",
    icon: FiCalendar,
    iconBg: "bg-emerald-950",
    iconColor: "text-emerald-400",
  },
  {
    value: "STAFF",
    label: "Staff Report",
    description: "Staff details, departments, designations",
    icon: FiUsers,
    iconBg: "bg-purple-950",
    iconColor: "text-purple-400",
  },
  {
    value: "LEAVE",
    label: "Leave Report",
    description: "Leave applications and status",
    icon: FiFileText,
    iconBg: "bg-orange-950",
    iconColor: "text-orange-400",
  },
  {
    value: "SHIFT",
    label: "Shift Report",
    description: "Shift schedules and duty details",
    icon: FiClock,
    iconBg: "bg-blue-950",
    iconColor: "text-blue-400",
  },
  {
    value: "DEVICE",
    label: "Device Report",
    description: "Device activity and online status",
    icon: FiSmartphone,
    iconBg: "bg-rose-950",
    iconColor: "text-rose-400",
  },
];

export const REPORT_META = Object.fromEntries(
  REPORT_TYPES.map((report) => [report.value, report]),
);

export const REPORT_FILTERS = {
  ATTENDANCE: {
    dateRange: true,
    department: true,
    designation: true,
    status: true,
    device: true,
  },
  STAFF: {
    dateRange: false,
    department: true,
    designation: true,
    status: true,
    device: false,
  },
  LEAVE: {
    dateRange: true,
    department: true,
    designation: true,
    status: true,
    device: false,
  },
  SHIFT: {
    dateRange: true,
    department: true,
    designation: true,
    status: false,
    device: false,
  },
  DEVICE: {
    dateRange: false,
    department: false,
    designation: false,
    status: true,
    device: true,
  },
};

export const STATUS_OPTIONS = {
  ATTENDANCE: [
    { value: "PRESENT", label: "Present" },
    { value: "LATE", label: "Late" },
    { value: "ABSENT", label: "Absent" },
    { value: "ON_LEAVE", label: "On Leave" },
    { value: "HOLIDAY", label: "Holiday" },
  ],
  STAFF: [
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
  ],
  LEAVE: [
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "CANCELLED", label: "Cancelled" },
  ],
  SHIFT: [],
  DEVICE: [
    { value: "ONLINE", label: "Online" },
    { value: "OFFLINE", label: "Offline" },
    { value: "WARNING", label: "Warning" },
  ],
};

export const EXPORT_FORMATS = [
  {
    value: "XLSX",
    label: "Excel (XLSX)",
    hint: "Best for data analysis",
    icon: FaFileExcel,
    iconColor: "text-green-400",
  },
  {
    value: "PDF",
    label: "PDF",
    hint: "Best for printing",
    icon: FaFilePdf,
    iconColor: "text-red-400",
  },
  {
    value: "CSV",
    label: "CSV",
    hint: "Lightweight format",
    icon: FaFileCsv,
    iconColor: "text-blue-400",
  },
  {
    value: "PRINT",
    label: "Print View",
    hint: "Open in new tab",
    icon: FaPrint,
    iconColor: "text-amber-400",
  },
];

export const FORMAT_META = Object.fromEntries(
  EXPORT_FORMATS.map((format) => [format.value, format]),
);

const toDate = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

export const formatDate = (value) => {
  if (!value) return "";
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (value) => {
  if (!value) return "";
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${formatDate(value)}, ${time}`;
};

export const formatRange = (range) =>
  range?.from && range?.to
    ? `${formatDate(range.from)} - ${formatDate(range.to)}`
    : "";
