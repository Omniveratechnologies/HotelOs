import { apiFetch } from "@hotelos/api";
import API_BASE_URL from "../config/api.js";

const tablesPath = `${API_BASE_URL}/v1/tables`;

const unwrap = async (request) => {
  const response = await request;
  return response.data;
};

export const getTables = () => unwrap(apiFetch(tablesPath, { auth: true }));
export const createTable = (table) =>
  unwrap(apiFetch(tablesPath, { method: "POST", auth: true, body: table }));
export const updateTable = (id, table) =>
  unwrap(
    apiFetch(`${tablesPath}/${id}`, {
      method: "PATCH",
      auth: true,
      body: table,
    }),
  );
export const deleteTable = (id) =>
  apiFetch(`${tablesPath}/${id}`, { method: "DELETE", auth: true });

export const downloadTableQr = async (id) => {
  const token = localStorage.getItem("auth_token");
  const response = await fetch(`${tablesPath}/${id}/qr`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error("Failed to generate QR code");
  return response.blob();
};
