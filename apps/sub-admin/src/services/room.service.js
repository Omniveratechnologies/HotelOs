import { api } from "@hotelos/api";

// =====================================================
// ROOMS
// =====================================================

export const getRooms = async () => {
  const result = await api.get("/api/v1/rooms", { auth: true });

  return result.data;
};

export const getRoomById = async (id) => {
  const result = await api.get(`/api/v1/rooms/${id}`, { auth: true });

  return result.data;
};

export const createRoom = async (data) => {
  const result = await api.post("/api/v1/rooms", data, { auth: true });

  return result.data;
};

export const updateRoom = async (id, data) => {
  const result = await api.patch(`/api/v1/rooms/${id}`, data, { auth: true });

  return result.data;
};

export const deleteRoom = async (id) => {
  const result = await api.delete(`/api/v1/rooms/${id}`, { auth: true });

  return result.data;
};
