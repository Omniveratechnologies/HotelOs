import { apiFetch } from "@hotelos/api";
import API_BASE_URL from "../config/api.js";

const path = `${API_BASE_URL}/v1/food-items`;
const unwrap = async (request) => (await request).data;

export const getMenuItems = () => unwrap(apiFetch(path, { auth: true }));
export const createMenuItem = (item) =>
  unwrap(apiFetch(path, { method: "POST", auth: true, body: item }));
export const updateMenuItem = (id, item) =>
  unwrap(
    apiFetch(`${path}/${id}`, { method: "PATCH", auth: true, body: item }),
  );
export const deleteMenuItem = (id) =>
  apiFetch(`${path}/${id}`, { method: "DELETE", auth: true });
