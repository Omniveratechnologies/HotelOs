import type { ServiceKind, Status } from "@/types/guest-dashboard";

/**
 * Every service action is a finite-state machine with strictly forward
 * (acyclic) transitions. Order of the array is the order of the stages.
 */
export const STATUS_FLOWS: Record<ServiceKind, readonly Status[]> = {
  food: [
    "Order Placed",
    "Kitchen Received",
    "Preparing",
    "Out for Delivery",
    "Delivered",
  ],
  amenities: ["Requested", "Housekeeping Assigned", "In Progress", "Delivered"],
  restaurant: ["Requested", "Completed"],
  reception: ["Requested", "Completed"],
  housekeeping: ["Requested", "Assigned", "Cleaning", "Completed"],
} as const;

export const SERVICE_LABEL: Record<ServiceKind, string> = {
  food: "Food Order",
  amenities: "Amenities",
  restaurant: "Restaurant Call",
  reception: "Reception",
  housekeeping: "Housekeeping",
};

/** Debounce window for Do Not Disturb sync: rapid toggles send one update. */
export const DND_DEBOUNCE_MS = 900;

/** How long the "Updated" confirmation stays on the refresh card. */
export const REFRESH_CONFIRM_MS = 1400;

/** How long the success checkmark overlay stays visible in a modal. */
export const MODAL_SUCCESS_MS = 800;
