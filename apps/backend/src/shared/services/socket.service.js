import { getIo } from "#/config/socket.js";

export function emitToHotel(hotelId, event, payload) {
  if (!hotelId) return;
  getIo().to(`hotel:${hotelId.toString()}`).emit(event, payload);
}

export function emitToGuest(guestId, event, payload) {
  if (!guestId) return;
  getIo().to(`guest:${guestId.toString()}`).emit(event, payload);
}
