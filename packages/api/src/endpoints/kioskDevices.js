import { api } from "../apiFetch.js";

/**
 * Fetch kiosk devices for hotel.
 * @param {Object} params - { status, q }
 */
export const getKioskDevices = async (params = {}) => {
  const result = await api.get("/api/v1/kiosks", {
    auth: true,
    params,
  });
  return result.data;
};

/**
 * Register a new kiosk terminal.
 * @param {Object} data - { deviceId, name, location, supportedFeatures, firmwareVersion }
 */
export const createKioskDevice = async (data) => {
  const result = await api.post("/api/v1/kiosks", data, {
    auth: true,
  });
  return result.data;
};

/**
 * Update kiosk terminal settings.
 * @param {string} id
 * @param {Object} data
 */
export const updateKioskDevice = async (id, data) => {
  const result = await api.patch(`/api/v1/kiosks/${id}`, data, {
    auth: true,
  });
  return result.data;
};

/**
 * Regenerate terminal pairing code.
 * @param {string} id
 */
export const regenerateKioskPairCode = async (id) => {
  const result = await api.post(
    `/api/v1/kiosks/${id}/regenerate-pair-code`,
    {},
    {
      auth: true,
    },
  );
  return result.data;
};

/**
 * Delete a kiosk terminal.
 * @param {string} id
 */
export const deleteKioskDevice = async (id) => {
  const result = await api.delete(`/api/v1/kiosks/${id}`, {
    auth: true,
  });
  return result.data;
};
