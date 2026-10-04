import RatePlan from "#/modules/rate-plans/models/RatePlan.js";
import Room from "#/modules/rooms/models/Room.js";

// Pure pricing helpers + rate resolution. All money is in whole rupees;
// every line is rounded to the nearest rupee (Math.round). Display formatting
// happens on the client (shared formatCurrency).

const round = (n) => Math.round(Number(n) || 0);

/**
 * Maps adult count to a rate-plan occupancy bucket.
 *
 * @param {number} adults
 * @returns {'single'|'double'|'triple'|'quad'}
 */
export function occupancyForGuests(adults) {
  const count = Number(adults) || 1;
  if (count <= 1) return "single";
  if (count === 2) return "double";
  if (count === 3) return "triple";
  return "quad";
}

/**
 * Resolves the nightly rate for a booking request.
 *
 * Order: explicit `overrideRate` → `ratePlanId` → RatePlan matched by
 * roomTypeCode + occupancy + mealPlan → any Room's flat `rate` for the type.
 *
 * @param {Object} input
 * @param {string} input.hotelId
 * @param {string} [input.roomTypeCode] - Aiosell roomCode of the chosen type.
 * @param {string} [input.ratePlanId] - Explicit rate plan id.
 * @param {string} [input.occupancy] - single|double|triple|quad (derived from adults when omitted by caller).
 * @param {string} [input.mealPlan] - EP|AP|MAP|CP|BP (defaults to EP for matching).
 * @param {number} [input.overrideRate] - Manual per-night rate override.
 * @returns {Promise<{ nightlyRate: number, rateSource: 'ratePlan'|'room'|'override', ratePlan: object|null }>}
 */
export async function resolveNightlyRate({
  hotelId,
  roomTypeCode,
  ratePlanId,
  occupancy,
  mealPlan,
  overrideRate,
}) {
  if (overrideRate != null && Number(overrideRate) >= 0) {
    return {
      nightlyRate: round(overrideRate),
      rateSource: "override",
      ratePlan: null,
    };
  }

  if (ratePlanId) {
    const plan = await RatePlan.findOne({
      _id: ratePlanId,
      hotelId,
      isActive: true,
    }).lean();

    if (plan) {
      return {
        nightlyRate: round(plan.rate),
        rateSource: "ratePlan",
        ratePlan: plan,
      };
    }
  }

  if (roomTypeCode) {
    const matched = await RatePlan.findOne({
      hotelId,
      roomCode: roomTypeCode,
      occupancy: occupancy || "double",
      mealPlan: mealPlan || "EP",
      isActive: true,
    }).lean();

    if (matched) {
      return {
        nightlyRate: round(matched.rate),
        rateSource: "ratePlan",
        ratePlan: matched,
      };
    }

    const room = await Room.findOne({
      hotelId,
      roomCode: roomTypeCode,
    }).lean();
    if (room) {
      return {
        nightlyRate: round(room.rate),
        rateSource: "room",
        ratePlan: null,
      };
    }
  }

  return { nightlyRate: 0, rateSource: "room", ratePlan: null };
}

/**
 * Computes a full price breakdown. Discount applies to the room charge
 * BEFORE tax; add-ons are taxable.
 *
 * @param {Object} input
 * @param {number} input.nightlyRate - Whole-rupee nightly rate.
 * @param {number} input.nights - Nights (>=1).
 * @param {number} [input.rooms=1]
 * @param {{ label: string, amount: number, quantity?: number }[]} [input.addOns]
 * @param {{ type: 'percent'|'flat', value: number }} [input.discount]
 * @param {number} [input.taxPercent=12]
 * @param {number|null} [input.commissionPercent] - OTA commission %.
 * @returns {{ nightlyRate: number, nights: number, rooms: number, roomCharge: number,
 *   addOns: object[], addOnsTotal: number, discount: object, taxableBase: number,
 *   taxPercent: number, taxAmount: number, grandTotal: number,
 *   commissionAmount: number|null, netAmount: number|null, currency: string }}
 */
export function computePricing({
  nightlyRate,
  nights,
  rooms = 1,
  addOns = [],
  discount = null,
  taxPercent = 12,
  commissionPercent = null,
}) {
  const safeNights = Math.max(1, Number(nights) || 1);
  const safeRooms = Math.max(1, Number(rooms) || 1);
  const rate = round(nightlyRate);

  const roomCharge = rate * safeNights * safeRooms;

  const addOnsList = (Array.isArray(addOns) ? addOns : []).map((a) => ({
    label: String(a.label || "Add-on"),
    amount: round(a.amount),
    quantity: Math.max(1, Number(a.quantity) || 1),
  }));
  const addOnsTotal = addOnsList.reduce(
    (sum, a) => sum + a.amount * a.quantity,
    0,
  );

  let discountAmount = 0;
  let discountInfo = { type: null, value: 0, amount: 0 };
  if (discount && Number(discount.value) > 0) {
    if (discount.type === "percent") {
      discountAmount = Math.min(
        roomCharge,
        round((roomCharge * Number(discount.value)) / 100),
      );
      discountInfo = {
        type: "percent",
        value: Number(discount.value),
        amount: discountAmount,
      };
    } else {
      discountAmount = Math.min(roomCharge, round(discount.value));
      discountInfo = {
        type: "flat",
        value: round(discount.value),
        amount: discountAmount,
      };
    }
  }

  const taxableBase = roomCharge - discountAmount + addOnsTotal;
  const pct = Number(taxPercent) || 0;
  const taxAmount = round((taxableBase * pct) / 100);
  const grandTotal = taxableBase + taxAmount;

  let commissionAmount = null;
  let netAmount = null;
  if (commissionPercent != null && Number(commissionPercent) > 0) {
    // OTA commission is charged on the pre-tax (post-discount) amount.
    commissionAmount = round((taxableBase * Number(commissionPercent)) / 100);
    netAmount = grandTotal - commissionAmount;
  }

  return {
    nightlyRate: rate,
    nights: safeNights,
    rooms: safeRooms,
    roomCharge,
    addOns: addOnsList,
    addOnsTotal,
    discount: discountInfo,
    taxableBase,
    taxPercent: pct,
    taxAmount,
    grandTotal,
    commissionAmount,
    netAmount,
    currency: "INR",
  };
}
