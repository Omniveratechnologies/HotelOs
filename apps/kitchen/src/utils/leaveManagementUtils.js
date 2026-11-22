import API_BASE_URL from "../config/api";

const pad = (n) => String(n).padStart(2, "0");

export const toInputDate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const monthRange = () => {
  const now = new Date();
  return {
    from: toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toInputDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

// UI filter state. `toQuery` below maps these to the backend's query names.
export const initialFilters = () => ({
  search: "",
  department: "",
  leaveType: "",
  status: "",
  ...monthRange(),
});

// UI filters -> GET /leaves and GET /leaves/stats query string
export const toQuery = (filters) => {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.department) params.set("department_id", filters.department);
  if (filters.leaveType) params.set("leave_type_id", filters.leaveType);
  if (filters.status) params.set("status", filters.status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return params;
};

// Leave dates are "YYYY-MM-DD" (hotel-local), so format them in UTC.
export const formatLeaveDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "-";

// appliedAt is a real timestamp
export const formatAppliedDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

// path is relative to /api/v1, e.g. "/leaves", "/leaves/types",
// "/staffManagement/departments". Returns the whole JSON envelope.
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

export const inputCls =
  "w-full rounded-lg border border-gray-700 bg-[#151515] px-3 py-2 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-emerald-400";

export const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 py-2 text-xs font-semibold text-black transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50";

export const buttonGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-xs font-semibold text-gray-300 transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50";