export const roomResponseDTO = (room) => ({
  id: room._id,
  roomNumber: room.roomNumber,
  floor: room.floor,
  type: room.type,
  status: room.status,
  rate: room.rate,
  currentGuest: room.currentGuest,
  checkIn: room.checkIn,
  checkOut: room.checkOut,
});
