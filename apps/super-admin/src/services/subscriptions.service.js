import {
  getHotelById,
  getHotels,
  updateHotelDetails,
} from "./hotel.service.js";

// =====================================================
// FETCH ALL SUBSCRIPTIONS
//
// Derived from the hotel records because the backend
// subscription dates are stored directly on each hotel.
// =====================================================

export async function fetchSubscriptions() {
  const hotels = await getHotels();

  return hotels.map((hotel) => ({
    _id: hotel._id,
    hotelId: hotel._id,
    hotelName: hotel.name,
    plan: hotel.plan || "Standard",
    startDate: hotel.subscriptionStartDate || null,
    endDate: hotel.subscriptionEndDate || null,
    status: hotel.status,
  }));
}

// =====================================================
// FETCH ONE HOTEL'S SUBSCRIPTION
// =====================================================

export async function fetchHotelSubscription(hotelId) {
  const hotel = await getHotelById(hotelId);

  return {
    _id: hotel._id,
    hotelId: hotel._id,
    hotelName: hotel.name,
    plan: hotel.plan || "Standard",
    startDate: hotel.subscriptionStartDate || null,
    endDate: hotel.subscriptionEndDate || null,
    status: hotel.status,
  };
}

// =====================================================
// CREATE / UPDATE SUBSCRIPTION
// =====================================================

export async function saveSubscription(hotelId, { plan, startDate, endDate }) {
  return updateHotelDetails(hotelId, {
    plan,
    subscriptionStartDate: startDate,
    subscriptionEndDate: endDate,
  });
}
