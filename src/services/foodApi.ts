import { apiRequest } from "./apiClient";
import type { MenuItem } from "@/types/guest-dashboard";

export async function fetchFoodItems(): Promise<MenuItem[]> {
  return apiRequest<MenuItem[]>("/food-items");
}