import API_BASE_URL from "../config/api";

// ------------------------------------------------------------------ API
// path is relative to /api/v1, e.g. "/faces/summary". Returns the whole JSON envelope.
// Pass `headers: {}` with a FormData body so the browser sets the multipart boundary itself.
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

const BASE = "/faces"; // app.use("/api/v1/faces", faceRoutes)
export const api = (path, options) => request(`${BASE}${path}`, options);
export const del = (path, body) => api(path, { method: "DELETE", body: JSON.stringify(body || {}) });
export const upload = (path, formData) => api(path, { method: "POST", body: formData, headers: {} });

export const query = (values) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) params.set(key, value);
  });
  return params.toString();
};

// "/faces/:id/samples/:sid/image" (from the API) -> full address for <img src>
export const imageUrl = (path) => `${API_BASE_URL}/v1${path}`;

// ------------------------------------------------------------------ dates
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

export const initialsOf = (name = "") =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "?";

// ------------------------------------------------------------------ classes
// inputCls carries "w-full", which beats "w-auto" in Tailwind's CSS order. Use fieldCls for inline controls.
export const inputCls =
  "w-full rounded-lg border border-gray-700 bg-[#151515] px-3 py-2 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 [color-scheme:dark]";
export const fieldCls = inputCls.replace("w-full", "").trim();
export const labelCls = "text-[11px] font-medium text-gray-400";
export const rowBtn =
  "inline-flex min-w-[68px] items-center justify-center rounded-md border px-3 py-1.5 text-[11px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
export const registerBtn = `${rowBtn} border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500`;
export const updateBtn = `${rowBtn} border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20`;