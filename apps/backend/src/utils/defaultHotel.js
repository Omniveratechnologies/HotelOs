export const FALLBACK_HOTEL_ID = "64b0f0f0f0f0f0f0f0f0f0a1";

export const defaultHotelId = () =>
  process.env.STAFF_DEFAULT_HOTEL_ID || FALLBACK_HOTEL_ID;
