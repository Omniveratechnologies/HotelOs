export { api, apiFetch, ApiError } from "./apiFetch.js";

// Re-export all endpoint modules
export * as authApi from "./endpoints/auth.js";
export * as hotelsApi from "./endpoints/hotels.js";
export * as roomsApi from "./endpoints/rooms.js";
export * as roomTypesApi from "./endpoints/roomTypes.js";
export * as ratePlansApi from "./endpoints/ratePlans.js";
export * as guestsApi from "./endpoints/guests.js";
export * as ordersApi from "./endpoints/orders.js";
export * as serviceRequestsApi from "./endpoints/serviceRequests.js";
export * as dashboardApi from "./endpoints/dashboard.js";
export * as membersApi from "./endpoints/members.js";
export * as invitationsApi from "./endpoints/invitations.js";
export * as subscriptionsApi from "./endpoints/subscriptions.js";
export * as transactionsApi from "./endpoints/transactions.js";
export * as usersApi from "./endpoints/users.js";

// Also re-export direct functions for convenient imports
export {
  getStoredToken,
  getStoredUser,
  isAuthenticated,
  clearAuth,
  storeAuth,
  login,
  forgotUsername,
  forgotPassword,
  resetPassword,
} from "./endpoints/auth.js";
export * from "./endpoints/auth.js";
export * from "./endpoints/hotels.js";
export * from "./endpoints/rooms.js";
export * from "./endpoints/roomTypes.js";
export {
  getRatePlans,
  createRatePlan,
  updateRatePlan,
  deleteRatePlan,
  syncRatePlans,
} from "./endpoints/ratePlans.js";
export * from "./endpoints/guests.js";
export * from "./endpoints/orders.js";
export * from "./endpoints/serviceRequests.js";
export * from "./endpoints/dashboard.js";
export * from "./endpoints/members.js";
export * from "./endpoints/invitations.js";
export * from "./endpoints/subscriptions.js";
export * from "./endpoints/transactions.js";
export * from "./endpoints/users.js";
