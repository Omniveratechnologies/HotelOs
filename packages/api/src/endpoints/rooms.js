import { api } from "../apiFetch.js";

/**
 * Fetches all rooms belonging to current hotel.
 * @returns {Promise<Array<object>>}
 */
export const getRooms = async () => {
  const result = await api.get("/api/v1/rooms", { auth: true });
  return result.data || [];
};

/**
 * Fetches a single room by ID.
 * @param {string} id
 * @returns {Promise<object>}
 */
export const getRoomById = async (id) => {
  const result = await api.get(`/api/v1/rooms/${id}`, { auth: true });
  return result.data;
};

/**
 * Creates a new hotel room.
 * @param {object} params
 * @param {string} params.roomNumber
 * @param {string} params.type
 * @param {number|string} params.rate
 * @param {number|string} params.floor
 * @param {string} [params.roomCode]
 * @returns {Promise<object>}
 */
export const createRoom = async ({
  roomNumber,
  type,
  rate,
  floor,
  roomCode,
}) => {
  const payload = {
    roomNumber,
    type,
    rate: Number(rate),
    floor: Number(floor),
  };
  if (roomCode !== undefined && roomCode !== null) {
    payload.roomCode = String(roomCode).trim();
  }
  const result = await api.post("/api/v1/rooms", payload, { auth: true });
  return result.data;
};

/**
 * Updates room properties or status.
 * @param {string} roomId
 * @param {object} updates
 * @returns {Promise<object>}
 */
export const updateRoom = async (roomId, updates) => {
  const result = await api.patch(`/api/v1/rooms/${roomId}`, updates, {
    auth: true,
  });
  return result.data;
};

/**
 * Deletes a hotel room.
 * @param {string} roomId
 * @returns {Promise<object>}
 */
export const deleteRoom = async (roomId) => {
  const result = await api.delete(`/api/v1/rooms/${roomId}`, { auth: true });
  return result.data || result;
};
