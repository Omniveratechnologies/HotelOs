import { apiRequest } from "./apiClient";
import type { ServiceRequest } from "@/types/guest-dashboard";

export async function createServiceRequest(
  type: ServiceRequest["type"],
  description?: string,
  items?: string[],
  details?: Record<string, unknown>,
) {
  return apiRequest<ServiceRequest>("/service-requests", {
    method: "POST",
    body: JSON.stringify({ type, description, items, details }),
  });
}

export async function fetchMyServiceRequests(): Promise<ServiceRequest[]> {
  return apiRequest<ServiceRequest[]>("/service-requests");
}
