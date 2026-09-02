import { apiRequest } from "./apiClient";
import type { GuestInfo } from "@/types/guest-dashboard";

export async function fetchMyProfile(): Promise<GuestInfo> {
  return apiRequest<GuestInfo>("/guests/me");
}
