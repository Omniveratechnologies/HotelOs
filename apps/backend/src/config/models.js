/**
 * @file models.js
 * @description Centralized Mongoose Model Registry for HotelOS.
 *
 * In Node.js / Mongoose architectures where background workers (BullMQ), seed scripts,
 * or cron jobs run in standalone processes without importing the Express `app.js` route tree,
 * Mongoose schemas are not automatically registered in memory. When any query performs a
 * `.populate()` across cross-module models (e.g. Booking -> User, Room -> Hotel), Mongoose throws:
 *   "Schema hasn't been registered for model '<ModelName>'. Use mongoose.model(name, schema)"
 *
 * Importing this file and invoking `registerAllModels()` immediately after `connectDB()`
 * guarantees that every domain schema is safely registered in `mongoose.models` across all runner processes.
 */

import "#/modules/users/models/User.js";
import "#/modules/hotels/models/Hotel.js";
import "#/modules/rooms/models/Room.js";
import "#/modules/room-types/models/RoomType.js";
import "#/modules/rate-plans/models/RatePlan.js";
import "#/modules/bookings/models/Booking.js";
import "#/modules/check-ins/models/CheckInSession.js";
import "#/modules/key-cards/models/KeyCard.js";
import "#/modules/corporate-companies/models/CorporateCompany.js";
import "#/modules/kiosks/models/KioskDevice.js";
import "#/modules/sessions/models/Session.js";
import "#/modules/sessions/models/KioskHandoff.js";
import "#/modules/service-requests/models/ServiceRequest.js";
import "#/modules/orders/models/Order.js";

/**
 * Ensures all application schemas are registered with Mongoose.
 * Safe to invoke multiple times (Mongoose retains singletons).
 */
export function registerAllModels() {
  // All domain models imported above are automatically compiled into mongoose.models
}
