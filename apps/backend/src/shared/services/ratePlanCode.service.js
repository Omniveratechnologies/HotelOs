// Aiosell rate plan codes are constructive:
//
//   {roomCode}-{occupancyLetter}-{mealSuffix}
//
// e.g. "executive-s-ep" = Executive room, single occupancy, room-only.
// mealPlanOf() in channelImport.service.js reverses this when pulling plans,
// so the two builders must stay in sync.

export const OCCUPANCY_LETTER_BY_TYPE = {
  single: "s",
  double: "d",
  triple: "t",
  quad: "q",
};

const OCCUPANCY_TYPE_BY_LETTER = {
  s: "single",
  d: "double",
  t: "triple",
  q: "quad",
};

// Builds the Aiosell rate plan code from the room code, occupancy and meal
// plan. Returns "" when there is no room code to anchor the code to.
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

// Reverses a rate plan code into its pieces (used by the import pipeline).
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
