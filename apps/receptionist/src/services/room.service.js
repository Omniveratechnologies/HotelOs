import { api } from "@hotelos/api";

export const getRooms = async () => {
  const result = await api.get("/api/v1/rooms", { auth: true });

  return result.data || [];
};

export const createRoom = async ({ roomNumber, type, rate, floor }) => {
  const result = await api.post(
    "/api/v1/rooms",
    { roomNumber, type, rate: Number(rate), floor: Number(floor) },
    { auth: true },
  );

  return result.data;
};

export const updateRoom = async (roomId, updates) => {
  const result = await api.patch(`/api/v1/rooms/${roomId}`, updates, {
    auth: true,
  });

  return result.data;
};

export const deleteRoom = async (roomId) => {
  return api.delete(`/api/v1/rooms/${roomId}`, { auth: true });
};
