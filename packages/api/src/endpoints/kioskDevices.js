import { api } from "../apiFetch.js";

/**
 * Fetch available kiosk dashboard presets configured on the backend.
 */
export const getKioskDashboards = async () => {
  const result = await api.get("/api/v1/kiosks/dashboards", {
    auth: true,
  });
  return result.data;
};

/**
 * Fetch kiosk devices (Super Admin: all or by hotelId; Sub-Admin: scoped to hotel).
 * @param {Object} params - { status, q, hotelId }
 */
export const getKioskDevices = async (params = {}) => {
  const result = await api.get("/api/v1/kiosks", {
    auth: true,
    params,
  });
  return result.data;
};

/**
 * Register a new kiosk terminal (Super Admin only).
 * @param {Object} data - { hotelId, deviceId, name, location, targetDashboard, customUrl, supportedFeatures, firmwareVersion }
 */
export const createKioskDevice = async (data) => {
  const result = await api.post("/api/v1/kiosks", data, {
    auth: true,
  });
  return result.data;
};

/**
 * Update kiosk terminal settings, reassign hotel, or switch target dashboard.
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
 * Regenerate terminal pairing code (Super Admin only).
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
 * Dispatch remote command to a kiosk terminal (Super Admin only).
 * @param {string} id
 * @param {Object} data - { command, payload }
 */
export const sendKioskCommand = async (id, data) => {
  const result = await api.post(`/api/v1/kiosks/${id}/command`, data, {
    auth: true,
  });
  return result.data;
};

/**
 * Delete a kiosk terminal (Super Admin only).
 * @param {string} id
 */
export const deleteKioskDevice = async (id) => {
  const result = await api.delete(`/api/v1/kiosks/${id}`, {
    auth: true,
  });
  return result.data;
};
