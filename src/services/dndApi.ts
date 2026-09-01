import { apiRequest } from "./apiClient";

export async function updateDND(enabled: boolean): Promise<{ dndEnabled: boolean }> {
  return apiRequest<{ dndEnabled: boolean }>("/guests/me/dnd", {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
}