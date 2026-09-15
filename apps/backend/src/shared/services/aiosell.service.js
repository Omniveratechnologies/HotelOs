import ChannelManagerConfig from "#/modules/channel-manager/models/ChannelManagerConfig.js";
import logger from "#/utils/logger.js";

// Credentials and baseUrl come ONLY from the DB-backed ChannelManagerConfig
// singleton (managed by SUPER_ADMIN via the config API, password select:false).
// No env vars required. The DB lookup is cached for a short TTL so Aiosell
// calls don't hit Mongo on every request; invalidateConfigCache() forces a
// refresh after the config is updated.
// Every call returns `{ ok: true, data }` or `{ ok: false, error }` — never
// throws.

const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedClient = null;
let cachedAt = 0;

function invalidateConfigCache() {
  cachedClient = null;
  cachedAt = 0;
}

async function resolveClient() {
  const now = Date.now();

  if (cachedClient && now - cachedAt < CONFIG_CACHE_TTL_MS) {
    return cachedClient.isEnabled
      ? { ok: true, client: cachedClient }
      : { ok: false, error: "Channel manager disabled" };
  }

  const config = await ChannelManagerConfig.findOne().select("+password");

  if (!config) {
    invalidateConfigCache();
    return { ok: false, error: "Aiosell not configured" };
  }

  cachedClient = {
    baseUrl: config.baseUrl,
    pmsSlug: config.pmsSlug,
    isEnabled: config.isEnabled,
    authHeader:
      "Basic " +
      Buffer.from(`${config.username}:${config.password}`).toString("base64"),
  };
  cachedAt = now;

  if (!cachedClient.isEnabled) {
    return { ok: false, error: "Channel manager disabled" };
  }

  return { ok: true, client: cachedClient };
}

async function request(path, body) {
  let resolved;
  try {
    resolved = await resolveClient();
  } catch (error) {
    logger.error(error, "Aiosell client resolution failed");
    return { ok: false, error: "Aiosell client resolution failed" };
  }

  if (!resolved.ok) return resolved;

  const { baseUrl, pmsSlug, authHeader } = resolved.client;

  try {
    const response = await fetch(`${baseUrl}${path}/${pmsSlug}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      logger.error(
        { status: response.status, path, data },
        "Aiosell API error",
      );
      return { ok: false, status: response.status, error: data };
    }

    return { ok: true, data };
  } catch (error) {
    logger.error(error, "Aiosell API request failed");
    return { ok: false, error: error.message };
  }
}

async function pushInventory(hotelCode, updates) {
  return request("/update", { hotelCode, updates });
}

async function pushRates(hotelCode, updates) {
  return request("/update-rates", { hotelCode, updates });
}

async function pushInventoryRestrictions(hotelCode, updates) {
  return request("/update", { hotelCode, updates });
}

async function pushRateRestrictions(hotelCode, updates) {
  return request("/update-rates", { hotelCode, updates });
}

async function markNoShow(hotelCode, bookingId) {
  return request("/marknoshow", { hotelCode, bookingId });
}

async function fetchInventory(hotelCode, startDate, endDate) {
  return request("/data", { type: "inventory", hotelCode, startDate, endDate });
}

async function fetchRates(hotelCode, startDate, endDate) {
  return request("/data", { type: "rates", hotelCode, startDate, endDate });
}

async function fetchReservations(hotelCode, startDate, endDate) {
  return request("/data", {
    type: "reservation",
    hotelCode,
    startDate,
    endDate,
  });
}

const aiosell = {
  invalidateConfigCache,
  pushInventory,
  pushRates,
  pushInventoryRestrictions,
  pushRateRestrictions,
  markNoShow,
  fetchInventory,
  fetchRates,
  fetchReservations,
};

export default aiosell;
