export const roomTypeDTO = (roomType) => ({
  id: roomType._id,
  hotelId: roomType.hotelId,
  roomCode: roomType.roomCode,
  name: roomType.name,
  description: roomType.description,
  count: roomType.count,
  active: roomType.active,
  minOccupancy: roomType.minOccupancy,
  maxOccupancy: roomType.maxOccupancy,
  channelSyncStatus: roomType.channelSyncStatus,
  createdAt: roomType.createdAt,
  updatedAt: roomType.updatedAt,
});
