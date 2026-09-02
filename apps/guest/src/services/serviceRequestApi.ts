import { apiRequest } from "./apiClient";
import type { ServiceRequest } from "@/types/guest-dashboard";

export async function createServiceRequest(
  type: "AMENITY" | "HOUSEKEEPING" | "RESTAURANT" | "RECEPTION" | "MAINTENANCE",
  description?: string,
  items?: string[],
) {
  return apiRequest<ServiceRequest>("/service-requests", {
    method: "POST",
    body: JSON.stringify({ type, description, items }),
  });
}

export async function fetchMyServiceRequests(): Promise<ServiceRequest[]> {
  return apiRequest<ServiceRequest[]>("/service-requests");
}
