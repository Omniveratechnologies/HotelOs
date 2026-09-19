// Aiosell rate plan codes are constructive:
//
//   {roomCode}-{occupancyLetter}-{mealSuffix}
//
// e.g. "executive-s-ep" = Executive room, single occupancy, room-only.
// mealPlanOf() in channelImport.service.js reverses this when pulling plans,
// so the two builders must stay in sync.

/**
 * @fileoverview This file provides utility functions for deriving and parsing Aiosell rate plan codes.
 * It defines the structure of rate plan codes and offers functions to construct and deconstruct them based on room code, occupancy, and meal plan.
 *
 * @module ratePlanCode
 */
export const OCCUPANCY_LETTER_BY_TYPE = {
  single: "s",
  double: "d",
  triple: "t",
  quad: "q",
};

/**
 * Maps occupancy letters to their corresponding occupancy types.
 * @type {Object}
 */
export const OCCUPANCY_TYPE_BY_LETTER = {
  s: "single",
  d: "double",
  t: "triple",
  q: "quad",
};

/**
 * Derives the Aiosell rate plan code from the room code, occupancy, and meal plan.
 * @param {string} roomCode - The code of the room.
 * @param {string} occupancy - The occupancy type (single, double, triple, quad).
 * @param {string} mealPlan - The meal plan.
 * @returns {string} The derived rate plan code.
 */
export function deriveRatePlanCode(roomCode, occupancy, mealPlan) {
  const room = String(roomCode || "")
    .trim()
    .toLowerCase();
  if (!room) return "";

  const letter = OCCUPANCY_LETTER_BY_TYPE[occupancy] || "s";
  const meal = String(mealPlan || "EP")
    .trim()
    .toLowerCase();

  return `${room}-${letter}-${meal}`;
}

/**
 * Parses the Aiosell rate plan code into its components: room code, occupancy, and meal plan.
 * @param {string} code - The rate plan code to parse.
 * @returns {Object} An object containing the room code, occupancy type, and meal plan.
 */
export function parseRatePlanCode(code) {
  const parts = String(code || "")
    .trim()
    .toLowerCase()
    .split("-");
  return {
    roomCode: parts.length > 0 ? parts[0] : "",
    occupancy: OCCUPANCY_TYPE_BY_LETTER[parts[1]] || "single",
    mealPlan: parts.length > 2 ? parts[2].toUpperCase() : "EP",
  };
}
