import { STATUS_FLOWS } from "@/constants/service-flows";
import type { ServiceKind, Status } from "@/types/guest-dashboard";

/** Next stage in the flow, or null when terminal. Never cycles. */
export function nextStatus(kind: ServiceKind, status: Status): Status | null {
  const stages = STATUS_FLOWS[kind];
  const index = stages.indexOf(status);
  if (index < 0 || index === stages.length - 1) return null;
  return stages[index + 1] ?? null;
}

export function initialStatus(kind: ServiceKind): Status {
  return STATUS_FLOWS[kind][0] as Status;
}

export function isTerminal(kind: ServiceKind, status: Status) {
  return nextStatus(kind, status) === null;
}

export function stageIndex(kind: ServiceKind, status: Status) {
  return Math.max(0, STATUS_FLOWS[kind].indexOf(status));
}

export type StatusTone = "neutral" | "amber" | "blue" | "green" | "red";

const AMBER_STATUSES = [
  "kitchen received",
  "preparing",
  "in progress",
  "assigned",
  "housekeeping assigned",
];
const BLUE_STATUSES = ["out for delivery", "cleaning"];
const GREEN_STATUSES = ["delivered", "completed"];

export function statusTone(status: Status, failed?: boolean): StatusTone {
  if (failed) return "red";
  const normalized = status.toLowerCase();
  if (GREEN_STATUSES.includes(normalized)) return "green";
  if (BLUE_STATUSES.includes(normalized)) return "blue";
  if (AMBER_STATUSES.includes(normalized)) return "amber";
  return "neutral";
}
