const viteEnv =
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

const nodeEnv =
  typeof process !== "undefined" && process.env ? process.env : {};

export const API_URL =
  viteEnv.VITE_API_URL || nodeEnv.VITE_API_URL || "http://localhost:5001";
