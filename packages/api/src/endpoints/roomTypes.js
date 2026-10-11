import { api } from "../apiFetch.js";

/**
 * Fetches all room types configured for current hotel.
 * @returns {Promise<Array<object>>}
 */
export const getRoomTypes = async () => {
  const result = await api.get("/api/v1/room-types", { auth: true });
  return result.data || [];
};

/**
 * Fetches a single room type by ID.
 * @param {string} id
 * @returns {Promise<object>}
 */
export const getRoomTypeById = async (id) => {
  const result = await api.get(`/api/v1/room-types/${id}`, { auth: true });
  return result.data;
};

/**
 * Creates a new room type.
 * @param {object} data
 * @returns {Promise<object>}
 */
export const createRoomType = async (data) => {
  const result = await api.post("/api/v1/room-types", data, { auth: true });
  return result.data;
};

/**
 * Updates an existing room type.
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export const updateRoomType = async (id, data) => {
  const result = await api.patch(`/api/v1/room-types/${id}`, data, {
    auth: true,
  });
  return result.data;
};

/**
 * Deletes a room type.
 * @param {string} id
 * @returns {Promise<object>}
 */
export const deleteRoomType = async (id) => {
  const result = await api.delete(`/api/v1/room-types/${id}`, { auth: true });
  return result.data || result;
};
