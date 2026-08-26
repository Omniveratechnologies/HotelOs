import { apiFetch } from "../utils/apiFetch.js";

export const getRooms = async () => {
  const result = await apiFetch("/api/v1/rooms", {
    method: "GET",
    auth: true,
  });

  return result.data || [];
};

export const createRoom = async ({ roomNumber, type, rate, floor }) => {
  const result = await apiFetch("/api/v1/rooms", {
    method: "POST",
    auth: true,
    body: { roomNumber, type, rate: Number(rate), floor: Number(floor) },
  });

  return result.data;
};

export const updateRoom = async (roomId, updates) => {
  const result = await apiFetch(`/api/v1/rooms/${roomId}`, {
    method: "PATCH",
    auth: true,
    body: updates,
  });

  return result.data;
};

export const deleteRoom = async (roomId) => {
  const result = await apiFetch(`/api/v1/rooms/${roomId}`, {
    method: "DELETE",
    auth: true,
  });

  return result;
};
