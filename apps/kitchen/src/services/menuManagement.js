import { apiFetch } from "@hotelos/api";
import API_BASE_URL from "../config/api.js";

const base = `${API_BASE_URL}/v1/menu`;
const unwrap = async (request) => (await request).data;
const crud = (resource) => ({
  list: () => unwrap(apiFetch(`${base}/${resource}`, { auth: true })),
  create: (body) =>
    unwrap(
      apiFetch(`${base}/${resource}`, { method: "POST", auth: true, body }),
    ),
  update: (id, body) =>
    unwrap(
      apiFetch(`${base}/${resource}/${id}`, {
        method: "PATCH",
        auth: true,
        body,
      }),
    ),
  remove: (id) =>
    apiFetch(`${base}/${resource}/${id}`, { method: "DELETE", auth: true }),
});

const categories = crud("categories");
const modifierGroups = crud("modifier-groups");
const discounts = crud("discounts");
const pricingRules = crud("pricing-rules");

export const getCategories = categories.list;
export const createCategory = categories.create;
export const updateCategory = categories.update;
export const deleteCategory = categories.remove;
export const getModifierGroups = modifierGroups.list;
export const createModifierGroup = modifierGroups.create;
export const updateModifierGroup = modifierGroups.update;
export const deleteModifierGroup = modifierGroups.remove;
export const getDiscounts = discounts.list;
export const createDiscount = discounts.create;
export const updateDiscount = discounts.update;
export const deleteDiscount = discounts.remove;
export const getPricingRules = pricingRules.list;
export const createPricingRule = pricingRules.create;
export const updatePricingRule = pricingRules.update;
export const deletePricingRule = pricingRules.remove;
