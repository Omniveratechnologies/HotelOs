import Booking from "../models/Booking.js";
import Counter from "../models/Counter.js";
import Hotel from "#/modules/hotels/models/Hotel.js";

/**
 * Generates the next sequential reservation number for a hotel, formatted
 * `{HOTELCODE}-{YYYY}-{NNN}` (e.g. HOS-2026-001). Sequential per hotel+year.
 *
 * @param {string|import("mongoose").Types.ObjectId} hotelId
 * @returns {Promise<string>}
 */
export async function nextReservationNo(hotelId) {
  const hotel = await Hotel.findById(hotelId).select("hotelCode").lean();
  const year = new Date().getFullYear();
  const scope = `reservation:${hotelId}:${year}`;

  // Retry once in the unlikely event two parallel creates collide on the
  // unique (hotelId, reservationNo) index.
  for (let attempt = 0; attempt < 2; attempt++) {
    // oxlint-disable-next-line no-await-in-loop -- sequential counters must be awaited in order
    const counter = await Counter.findOneAndUpdate(
      { scope },
      { $inc: { seq: 1 } },
      { upsert: true, new: true },
    );
    const reservationNo = `${(hotel?.hotelCode || "HOS").toUpperCase()}-${year}-${String(counter.seq).padStart(3, "0")}`;
    // oxlint-disable-next-line no-await-in-loop -- uniqueness check precedes the next increment
    const taken = await Booking.exists({ hotelId, reservationNo });
    if (!taken) return reservationNo;
  }

  throw new Error("Failed to allocate a reservation number");
}
