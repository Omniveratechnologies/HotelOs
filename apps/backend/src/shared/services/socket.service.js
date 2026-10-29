import { getIo } from "#/config/socket.js";

export function emitToHotel(hotelId, event, payload) {
  if (!hotelId) return;
  try {
    getIo().to(`hotel:${hotelId.toString()}`).emit(event, payload);
  } catch {
    // Socket server may not be initialized in test/standalone environments
  }
}

export function emitToGuest(guestId, event, payload) {
  if (!guestId) return;
  try {
    getIo().to(`guest:${guestId.toString()}`).emit(event, payload);
  } catch {
    // Socket server may not be initialized in test/standalone environments
  }
}
