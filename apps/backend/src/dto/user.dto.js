export const userResponseDTO = (user) => ({
    id: user._id,
    name: user.name,
    username: user.username,
    role: user.role,
    hotelId: user.hotelId,
    roomId: user.roomId,
    isActive: user.isActive
  });