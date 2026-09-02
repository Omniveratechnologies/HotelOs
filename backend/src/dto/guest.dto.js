export const guestProfileDTO = (user, room) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  role: user.role,
  hotelId: user.hotelId,
  checkIn: user.checkIn,
  checkOut: user.checkOut,
  dndEnabled: user.dndEnabled,
  room: room
    ? { id: room._id, roomNumber: room.roomNumber, type: room.type, status: room.status }
    : null,
});