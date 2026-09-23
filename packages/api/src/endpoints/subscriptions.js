import { getHotels, getHotelById, updateHotelDetails } from "./hotels.js";

/**
 * Calculates a hotel's subscription status based on its end date.
 *
 * @param {string|Date|null} endDate - Expiration date of the subscription
 * @returns {"no_subscription"|"expired"|"expiring_soon"|"active"} Subscription lifecycle status
 */
export function computeSubscriptionStatus(endDate) {
  if (!endDate) return "no_subscription";
  const now = new Date();
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return "no_subscription";
  if (now > end) return "expired";
  const daysRemaining = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysRemaining <= 30) return "expiring_soon";
  return "active";
}

/**
 * Fetches all hotels and maps them into subscription records with computed statuses.
 *
 * @returns {Promise<Array<object>>} List of hotel subscription objects
 */
export async function fetchSubscriptions() {
  const hotels = await getHotels();

  return hotels.map((hotel) => ({
    _id: hotel._id,
    hotelId: hotel._id,
    hotelName: hotel.name,
    hotelCode: hotel.hotelCode || "",
    email: hotel.email || "",
    plan: hotel.plan || "Standard",
    startDate: hotel.subscriptionStartDate || null,
    endDate: hotel.subscriptionEndDate || null,
    status: computeSubscriptionStatus(hotel.subscriptionEndDate),
  }));
}

/**
 * Fetches a single hotel's subscription details.
 *
 * @param {string} hotelId - ID of the hotel
 * @returns {Promise<object>} Subscription details for the specified hotel
 */
export async function fetchHotelSubscription(hotelId) {
  const hotel = await getHotelById(hotelId);

  return {
    _id: hotel._id,
    hotelId: hotel._id,
    hotelName: hotel.name,
    hotelCode: hotel.hotelCode || "",
    email: hotel.email || "",
    plan: hotel.plan || "Standard",
    startDate: hotel.subscriptionStartDate || null,
    endDate: hotel.subscriptionEndDate || null,
    status: computeSubscriptionStatus(hotel.subscriptionEndDate),
  };
}

/**
 * Updates a hotel's subscription plan and validity dates.
 *
 * @param {string} hotelId - ID of the hotel
 * @param {object} payload - Subscription payload
 * @param {string} payload.plan - Subscription plan name
 * @param {string} payload.startDate - Subscription start date (YYYY-MM-DD)
 * @param {string} payload.endDate - Subscription end date (YYYY-MM-DD)
 * @returns {Promise<object>} Updated hotel record
 */
export async function saveSubscription(hotelId, { plan, startDate, endDate }) {
  return updateHotelDetails(hotelId, {
    plan,
    subscriptionStartDate: startDate,
    subscriptionEndDate: endDate,
  });
}
