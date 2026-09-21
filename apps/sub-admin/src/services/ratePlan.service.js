import { api } from "@hotelos/api";

// =====================================================
// RATE PLANS
// =====================================================

export const getRatePlans = async () => {
  const result = await api.get("/api/v1/rate-plans", { auth: true });

  return result.data;
};

export const createRatePlan = async (data) => {
  const result = await api.post("/api/v1/rate-plans", data, { auth: true });

  return result.data;
};

export const updateRatePlan = async (id, data) => {
  const result = await api.patch(`/api/v1/rate-plans/${id}`, data, {
    auth: true,
  });

  return result.data;
};

export const deleteRatePlan = async (id) => {
  const result = await api.delete(`/api/v1/rate-plans/${id}`, { auth: true });

  return result.data;
};

export const syncRatePlans = async (dateRange = {}) => {
  const result = await api.post("/api/v1/rate-plans/sync", dateRange, {
    auth: true,
  });

  return result.data;
};

// =====================================================
// AIOSSELL DISTRIBUTION LIVE RATES
// =====================================================

export const getLiveRates = async ({ startDate, endDate } = {}) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const result = await api.get("/api/v1/channel-manager/distribution/rates", {
    auth: true,
    params,
  });
  return result.data;
};

export const updateLiveRates = async (payload) => {
  const result = await api.post(
    "/api/v1/channel-manager/distribution/rates",
    payload,
    {
      auth: true,
    },
  );
  return result.data;
};

export const updateRateRestrictions = async (payload) => {
  const result = await api.post(
    "/api/v1/channel-manager/distribution/rate-restrictions",
    payload,
    {
      auth: true,
    },
  );
  return result.data;
};
