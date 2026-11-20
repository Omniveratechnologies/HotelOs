import type { CartItem } from "../types";

/**
 * Stable React key for an order line item. Cart lines are merged by
 * food item, addons, and special instructions, so those fields together
 * uniquely identify a line without relying on the array index.
 */
export function orderItemKey(item: CartItem): string {
  const addons = (item.addons ?? [])
    .map((addon) => `${addon.name}:${addon.price}`)
    .join(",");
  return [
    item.foodItemId || item.name,
    item.specialInstructions ?? "",
    addons,
  ].join("|");
}
