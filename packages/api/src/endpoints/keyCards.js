import { api } from "../apiFetch.js";

/**
 * Fetch key cards with filters.
 * @param {Object} params - { status, keyType, q, page, limit }
 */
export const getKeyCards = async (params = {}) => {
  const result = await api.get("/api/v1/key-cards", {
    auth: true,
    params,
  });
  return result.data;
};

/**
 * Fetch key card stats.
 */
export const getKeyCardStats = async () => {
  const result = await api.get("/api/v1/key-cards/stats", {
    auth: true,
  });
  return result.data;
};

/**
 * Register a new card or batch generate cards.
 * @param {Object} data - { cardNumber, keyType, count, prefix }
 */
export const createKeyCard = async (data) => {
  const result = await api.post("/api/v1/key-cards", data, {
    auth: true,
  });
  return result.data;
};

/**
 * Assign key card to booking and room.
 * @param {Object} data - { cardNumber, cardId, bookingId, roomId, guestId, notes }
 */
export const assignKeyCard = async (data) => {
  const result = await api.post("/api/v1/key-cards/assign", data, {
    auth: true,
  });
  return result.data;
};

/**
 * Reissue a key card.
 * @param {string} id
 * @param {Object} data - { newCardNumber, reason }
 */
export const reissueKeyCard = async (id, data = {}) => {
  const result = await api.post(`/api/v1/key-cards/${id}/reissue`, data, {
    auth: true,
  });
  return result.data;
};

/**
 * Mark a key card as lost / blocked.
 * @param {string} id
 * @param {Object} data - { reason }
 */
export const blockKeyCard = async (id, data = {}) => {
  const result = await api.post(`/api/v1/key-cards/${id}/block`, data, {
    auth: true,
  });
  return result.data;
};

/**
 * Deactivate / return key card to stock.
 * @param {string} id
 */
export const deactivateKeyCard = async (id) => {
  const result = await api.post(
    `/api/v1/key-cards/${id}/deactivate`,
    {},
    {
      auth: true,
    },
  );
  return result.data;
};

/**
 * Delete a key card from inventory.
 * @param {string} id
 */
export const deleteKeyCard = async (id) => {
  const result = await api.delete(`/api/v1/key-cards/${id}`, {
    auth: true,
  });
  return result.data;
};
