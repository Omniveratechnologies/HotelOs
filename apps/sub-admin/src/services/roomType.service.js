import { api } from "@hotelos/api";

// =====================================================
// ROOM TYPES
// =====================================================

export const getRoomTypes = async () => {
  const result = await api.get("/api/v1/room-types", { auth: true });

  return result.data || [];
};

export const getRoomTypeById = async (id) => {
  const result = await api.get(`/api/v1/room-types/${id}`, { auth: true });

  return result.data;
};

export const createRoomType = async (data) => {
  const result = await api.post("/api/v1/room-types", data, { auth: true });

  return result.data;
};

export const updateRoomType = async (id, data) => {
  const result = await api.patch(`/api/v1/room-types/${id}`, data, {
    auth: true,
  });

  return result.data;
};

export const deleteRoomType = async (id) => {
  const result = await api.delete(`/api/v1/room-types/${id}`, { auth: true });

  return result.data;
};
