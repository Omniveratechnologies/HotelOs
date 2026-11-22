import { api } from "../apiFetch.js";

/**
 * Fetches all rooms belonging to current hotel or filtered by hotelId.
 * @param {object} [params]
 * @param {string} [params.hotelId]
 * @returns {Promise<Array<object>>}
 */
export const getRooms = async (params = {}) => {
  const result = await api.get("/api/v1/rooms", { params, auth: true });
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

/**
 * Checks out a room and any active reservations assigned to it.
 * @param {string} roomId
 * @param {object} [data] - { settlementMode, notes }
 * @returns {Promise<object>}
 */
export const checkOutRoom = async (roomId, data = {}) => {
  const result = await api.post(`/api/v1/rooms/${roomId}/check-out`, data, {
    auth: true,
  });
  return result.data;
};
