export type StatusTone = "neutral" | "amber" | "blue" | "green" | "red";

const AMBER_STATUSES = new Set(["PREPARING", "ACKNOWLEDGED", "IN_PROGRESS"]);
const BLUE_STATUSES = ["OUT_FOR_DELIVERY"];
const GREEN_STATUSES = ["DELIVERED", "COMPLETED"];
const RED_STATUSES = ["REJECTED", "CANCELLED"];

export function statusTone(status: string, failed?: boolean): StatusTone {
  if (failed) return "red";
  const normalized = status.toUpperCase();
  if (RED_STATUSES.includes(normalized)) return "red";
  if (GREEN_STATUSES.includes(normalized)) return "green";
  if (BLUE_STATUSES.includes(normalized)) return "blue";
  if (AMBER_STATUSES.has(normalized)) return "amber";
  return "neutral"; // NEW, REQUESTED
}
