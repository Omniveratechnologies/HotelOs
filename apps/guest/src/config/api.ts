const raw = (import.meta.env["VITE_API_URL"] ?? "http://localhost:5001")
  .trim()
  .replace(/\/+$/, "");
export const API_BASE_URL = raw.endsWith("/api/v1") ? raw : `${raw}/api/v1`;
