import { apiFetch } from "@hotelos/api";
import API_BASE_URL from "../config/api.js";

const base = `${API_BASE_URL}/v1/upselling`;
const unwrap = async (request) => (await request).data;
const request = (path, options = {}) =>
  unwrap(apiFetch(`${base}${path}`, { auth: true, ...options }));
const resource = (name) => ({
  list: () => request(`/${name}`),
  create: (body) => request(`/${name}`, { method: "POST", body }),
  update: (id, body) => request(`/${name}/${id}`, { method: "PATCH", body }),
  remove: (id) =>
    apiFetch(`${base}/${name}/${id}`, { method: "DELETE", auth: true }),
});

export const getUpsellingAnalytics = () => request("/analytics");
export const getUpsellingRules = resource("rules").list;
export const createUpsellingRule = resource("rules").create;
export const updateUpsellingRule = resource("rules").update;
export const deleteUpsellingRule = resource("rules").remove;
export const getPostOrderOffers = resource("post-order-offers").list;
export const createPostOrderOffer = resource("post-order-offers").create;
export const updatePostOrderOffer = resource("post-order-offers").update;
export const deletePostOrderOffer = resource("post-order-offers").remove;
export const getFastItems = resource("fast-items").list;
export const createFastItem = resource("fast-items").create;
export const updateFastItem = resource("fast-items").update;
export const deleteFastItem = resource("fast-items").remove;
export const getSmartRules = resource("smart-rules").list;
export const createSmartRule = resource("smart-rules").create;
export const updateSmartRule = resource("smart-rules").update;
export const deleteSmartRule = resource("smart-rules").remove;
