export const guestProfileDTO = (user, booking, room) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  role: user.role,
  hotelId: user.hotelId,
  checkIn: booking?.checkIn ?? null,
  checkOut: booking?.checkOut ?? null,
  dndEnabled: booking?.dndEnabled ?? false,
  room: room
    ? {
        id: room._id,
        roomNumber: room.roomNumber,
        type: room.type,
        status: room.status,
      }
    : null,
});
